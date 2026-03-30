import {
  getAssemblyWithOwner,
  getObjectWithDynamicFields,
} from "@evefrontier/dapp-kit";
import { SuiJsonRpcClient } from "@mysten/sui/jsonRpc";

export type StorageInventory = {
  felspar: number;
  platinum: number;
};

export type StorageResourceEntry = {
  label: string;
  amount: number;
  typeId: string;
  source: "content" | "dynamic_field" | "linked_object" | "energy_source";
  debugKey?: string;
};

export type StorageSnapshot = {
  objectId: string;
  objectType: string;
  suiOwnerMode: string;
  gameplayOwner: string;
  gameplayOwnerAddress: string;
  status: string;
  version: string;
  digest: string;
  updatedAt: string;
  inventory: StorageInventory;
  resourceEntries: StorageResourceEntry[];
  contentPreview: string;
  contentKeys: string[];
  dynamicFieldCount: number;
  dynamicFieldPreview: string[];
};

type DynamicFieldNodeLite = {
  name?: { json?: unknown };
  contents?: { json?: unknown };
};

const typeNameCache = new Map<string, string>();

function parseOwner(owner: unknown): string {
  if (!owner || typeof owner !== "object") return "Unknown";

  const value = owner as Record<string, unknown>;
  if (typeof value.AddressOwner === "string")
    return `Address ${value.AddressOwner}`;
  if (typeof value.ObjectOwner === "string")
    return `Object ${value.ObjectOwner}`;
  if (value.Shared) return "Shared";
  if (value.Immutable) return "Immutable";

  return "Unknown";
}

function parseStatus(content: unknown): string {
  if (!content || typeof content !== "object") return "Unavailable";
  const maybeFields = (content as { fields?: Record<string, unknown> }).fields;
  if (!maybeFields) return "Unavailable";

  const keys = ["state", "status", "online", "is_online", "mode"];
  for (const key of keys) {
    const candidate = maybeFields[key];
    if (
      typeof candidate === "string" ||
      typeof candidate === "number" ||
      typeof candidate === "boolean"
    ) {
      return String(candidate);
    }
  }

  return "Detected";
}

function asNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "bigint") return Number(value);
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (/^0x[0-9a-f]+$/i.test(trimmed)) return null;
    const parsed = Number(trimmed);
    if (!Number.isFinite(parsed)) return null;
    if (Math.abs(parsed) > 1_000_000_000_000) return null;
    return parsed;
  }
  return null;
}

function extractAmountFromNode(node: unknown): number | null {
  if (!node || typeof node !== "object") return asNumber(node);
  const record = node as Record<string, unknown>;

  const amountKeys = [
    "amount",
    "quantity",
    "count",
    "balance",
    "qty",
    "stack_size",
    "stackSize",
  ];
  for (const key of amountKeys) {
    const parsed = asNumber(record[key]);
    if (parsed !== null) return parsed;
  }

  if (record.fields && typeof record.fields === "object") {
    return extractAmountFromNode(record.fields);
  }

  return null;
}

function extractTypeIdFromNode(node: unknown): string {
  if (!node || typeof node !== "object") return "-";
  const record = node as Record<string, unknown>;
  const keys = [
    "type_id",
    "typeId",
    "item_id",
    "itemId",
    "resource_id",
    "resourceId",
  ];

  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" || typeof value === "number") {
      return String(value);
    }
  }

  if (record.fields && typeof record.fields === "object") {
    return extractTypeIdFromNode(record.fields);
  }

  return "-";
}

function extractLinkedObjectId(node: unknown): string | null {
  if (!node || typeof node !== "object") return null;
  const record = node as Record<string, unknown>;

  if (typeof record.id === "string" && /^0x[0-9a-f]+$/i.test(record.id)) {
    return record.id;
  }

  const nestedId = record.id as Record<string, unknown> | undefined;
  if (
    nestedId &&
    typeof nestedId.id === "string" &&
    /^0x[0-9a-f]+$/i.test(nestedId.id)
  ) {
    return nestedId.id;
  }

  if (record.fields && typeof record.fields === "object") {
    return extractLinkedObjectId(record.fields);
  }

  return null;
}

async function resolveTypeName(
  tenant: string,
  typeId: string,
): Promise<string | null> {
  const normalized = typeId.trim();
  if (!normalized || normalized === "-" || !/^\d+$/.test(normalized)) {
    return null;
  }

  const cacheKey = `${tenant}:${normalized}`;
  if (typeNameCache.has(cacheKey)) {
    return typeNameCache.get(cacheKey) || null;
  }

  try {
    const response = await fetch(
      `https://world-api-${tenant}.live.tech.evefrontier.com/v2/types/${normalized}`,
    );
    if (!response.ok) return null;
    const data = (await response.json()) as { name?: string };
    const name = typeof data.name === "string" ? data.name : null;
    if (name) typeNameCache.set(cacheKey, name);
    return name;
  } catch {
    return null;
  }
}

function extractLabelFromNode(node: unknown): string {
  if (!node || typeof node !== "object") return "Unknown Resource";
  const record = node as Record<string, unknown>;
  const keys = [
    "name",
    "label",
    "symbol",
    "resource",
    "material",
    "kind",
    "type",
  ];

  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) {
      return value;
    }
  }

  if (record.fields && typeof record.fields === "object") {
    return extractLabelFromNode(record.fields);
  }

  return "Unknown Resource";
}

function collectContentEntries(node: unknown): StorageResourceEntry[] {
  const entries: StorageResourceEntry[] = [];

  const walk = (value: unknown) => {
    if (!value || typeof value !== "object") return;

    const amount = extractAmountFromNode(value);
    if (amount !== null && amount > 0) {
      entries.push({
        label: extractLabelFromNode(value),
        amount,
        typeId: extractTypeIdFromNode(value),
        source: "content",
      });
    }

    if (Array.isArray(value)) {
      for (const item of value) walk(item);
      return;
    }

    for (const child of Object.values(value as Record<string, unknown>)) {
      walk(child);
    }
  };

  walk(node);

  const dedup = new Map<string, StorageResourceEntry>();
  for (const entry of entries) {
    const key = `${entry.label}|${entry.amount}|${entry.typeId}|${entry.source}`;
    if (!dedup.has(key)) dedup.set(key, entry);
  }

  return [...dedup.values()].slice(0, 40);
}

function collectDynamicFieldEntries(
  dynamicFieldsResult: unknown,
): StorageResourceEntry[] {
  const nodes = ((
    dynamicFieldsResult as {
      data?: {
        object?: {
          asMoveObject?: {
            dynamicFields?: {
              nodes?: DynamicFieldNodeLite[];
            };
          };
        };
      };
    }
  )?.data?.object?.asMoveObject?.dynamicFields?.nodes ||
    []) as DynamicFieldNodeLite[];

  const entries: StorageResourceEntry[] = [];

  for (const node of nodes) {
    const nameJson = node.name?.json;
    const contentJson = node.contents?.json;
    const amount =
      extractAmountFromNode(contentJson) ?? extractAmountFromNode(nameJson);
    if (amount === null || amount <= 0) continue;

    const contentLabel = extractLabelFromNode(contentJson);
    const nameLabel = extractLabelFromNode(nameJson);
    const contentTypeId = extractTypeIdFromNode(contentJson);
    const nameTypeId = extractTypeIdFromNode(nameJson);
    const debugKey = JSON.stringify(nameJson ?? {}).slice(0, 140);

    entries.push({
      label: contentLabel !== "Unknown Resource" ? contentLabel : nameLabel,
      amount,
      typeId: contentTypeId !== "-" ? contentTypeId : nameTypeId,
      source: "dynamic_field",
      debugKey,
    });
  }

  return entries.slice(0, 40);
}

async function collectLinkedObjectEntries(
  client: SuiJsonRpcClient,
  dynamicFieldNodes: DynamicFieldNodeLite[],
  tenant: string,
): Promise<StorageResourceEntry[]> {
  const linkedIds = dynamicFieldNodes
    .map((node) => extractLinkedObjectId(node.contents?.json))
    .filter((id): id is string => Boolean(id));

  const objects = await Promise.all(
    linkedIds.map(async (id) => {
      const result = await client
        .getObject({
          id,
          options: {
            showType: true,
            showContent: true,
          },
        })
        .catch(() => null);
      return { id, result };
    }),
  );

  const entries: StorageResourceEntry[] = [];

  for (const { id, result } of objects) {
    const content = result?.data?.content;
    const rawEntries = collectContentEntries(content).map((entry) => ({
      ...entry,
      source: "linked_object" as const,
      debugKey: `linked:${id}`,
    }));

    if (rawEntries.length) {
      entries.push(...rawEntries);
      continue;
    }

    const typeId = extractTypeIdFromNode(content);
    const amount = extractAmountFromNode(content) ?? 0;
    const resolvedName = await resolveTypeName(tenant, typeId);
    const fallbackLabel =
      resolvedName ||
      extractLabelFromNode(content) ||
      result?.data?.type?.split("::").slice(-1)[0] ||
      "Linked Resource Object";

    entries.push({
      label: fallbackLabel,
      amount,
      typeId,
      source: "linked_object",
      debugKey: `linked:${id}`,
    });
  }

  return entries;
}

async function collectEnergySourceEntries(
  client: SuiJsonRpcClient,
  energySourceId: string | null,
  tenant: string,
): Promise<StorageResourceEntry[]> {
  if (!energySourceId) return [];

  const result = await client
    .getObject({
      id: energySourceId,
      options: {
        showType: true,
        showContent: true,
      },
    })
    .catch(() => null);

  const content = result?.data?.content;
  const entries = collectContentEntries(content).map((entry) => ({
    ...entry,
    source: "energy_source" as const,
    debugKey: `energy:${energySourceId}`,
  }));

  if (entries.length) return entries;

  const typeId = extractTypeIdFromNode(content);
  const resolvedName = await resolveTypeName(tenant, typeId);

  return [
    {
      label:
        resolvedName ||
        extractLabelFromNode(content) ||
        result?.data?.type?.split("::").slice(-1)[0] ||
        "Energy Source",
      amount: extractAmountFromNode(content) ?? 0,
      typeId,
      source: "energy_source",
      debugKey: `energy:${energySourceId}`,
    },
  ];
}

function getDynamicFieldNodes(
  dynamicFieldsResult: unknown,
): DynamicFieldNodeLite[] {
  return ((
    dynamicFieldsResult as {
      data?: {
        object?: {
          asMoveObject?: {
            dynamicFields?: {
              nodes?: DynamicFieldNodeLite[];
            };
          };
        };
      };
    }
  )?.data?.object?.asMoveObject?.dynamicFields?.nodes ||
    []) as DynamicFieldNodeLite[];
}

function buildDynamicFieldPreview(dynamicFieldsResult: unknown): {
  count: number;
  preview: string[];
} {
  const nodes = getDynamicFieldNodes(dynamicFieldsResult);
  const preview = nodes.slice(0, 12).map((node, index) => {
    const name = JSON.stringify(node.name?.json ?? {}).slice(0, 140);
    const content = JSON.stringify(node.contents?.json ?? {}).slice(0, 140);
    return `#${index + 1} name=${name} content=${content}`;
  });

  return { count: nodes.length, preview };
}

function buildContentPreview(content: unknown): {
  keys: string[];
  preview: string;
} {
  if (!content || typeof content !== "object") {
    return { keys: [], preview: "(no content)" };
  }

  const root = content as Record<string, unknown>;
  const keys = Object.keys(root).slice(0, 30);
  const preview = JSON.stringify(content).slice(0, 900);
  return { keys, preview };
}

function normalizeEntries(
  entries: StorageResourceEntry[],
): StorageResourceEntry[] {
  const map = new Map<string, StorageResourceEntry>();

  for (const entry of entries) {
    const normalizedLabel = entry.label.trim() || "Unknown Resource";
    const key = `${normalizedLabel.toLowerCase()}|${entry.typeId}|${entry.source}|${entry.debugKey || ""}`;
    const existing = map.get(key);
    if (!existing) {
      map.set(key, {
        ...entry,
        label: normalizedLabel,
        typeId: entry.typeId || "-",
      });
      continue;
    }
    existing.amount = Math.max(existing.amount, entry.amount);
  }

  return [...map.values()].sort((a, b) => b.amount - a.amount);
}

function traverseForMaterial(node: unknown, aliases: string[]): number {
  let best = 0;

  const visit = (value: unknown, keyHint: string) => {
    if (value === null || value === undefined) return;

    if (Array.isArray(value)) {
      for (const item of value) visit(item, keyHint);
      return;
    }

    if (typeof value !== "object") {
      if (aliases.some((alias) => keyHint.includes(alias))) {
        const parsed = asNumber(value);
        if (parsed !== null) best = Math.max(best, parsed);
      }
      return;
    }

    const record = value as Record<string, unknown>;
    for (const [key, child] of Object.entries(record)) {
      const normalizedKey = key.toLowerCase();

      const descriptor = [
        typeof record.name === "string" ? record.name.toLowerCase() : "",
        typeof record.type === "string" ? record.type.toLowerCase() : "",
        typeof record.symbol === "string" ? record.symbol.toLowerCase() : "",
        normalizedKey,
      ].join(" ");

      if (aliases.some((alias) => descriptor.includes(alias))) {
        const parsed =
          extractAmountFromNode(child) ?? extractAmountFromNode(record);
        if (parsed !== null) best = Math.max(best, parsed);
      }

      visit(child, normalizedKey);
    }
  };

  visit(node, "");
  return best;
}

export function extractInventory(content: unknown): StorageInventory {
  const felspar = traverseForMaterial(content, ["felspar", "veldspar"]);
  const platinum = traverseForMaterial(content, ["platinum", "pt"]);
  return { felspar, platinum };
}

export async function fetchStorageSnapshot(
  client: SuiJsonRpcClient,
  storageObjectId: string,
): Promise<StorageSnapshot> {
  const hasGraphContext = Boolean(
    import.meta.env.VITE_EVE_WORLD_PACKAGE_ID &&
    import.meta.env.VITE_SUI_GRAPHQL_ENDPOINT,
  );

  const result = await client.getObject({
    id: storageObjectId,
    options: {
      showType: true,
      showOwner: true,
      showContent: true,
    },
  });

  const ownerResult = hasGraphContext
    ? await getAssemblyWithOwner(storageObjectId).catch(() => null)
    : null;
  const dynamicFieldsResult = hasGraphContext
    ? await getObjectWithDynamicFields(storageObjectId).catch(() => null)
    : null;

  if (result.error || !result.data) {
    throw new Error(
      result.error?.code || "Storage object not found on current RPC.",
    );
  }

  const assemblyOwner = (
    ownerResult as {
      assemblyOwner?: {
        name?: string;
        address?: string;
        id?: string;
      } | null;
    } | null
  )?.assemblyOwner;

  const contentEntries = collectContentEntries(result.data.content);
  const dynamicEntries = collectDynamicFieldEntries(dynamicFieldsResult);
  const dynamicNodes = getDynamicFieldNodes(dynamicFieldsResult);
  const rootFields = (
    result.data.content as { fields?: Record<string, unknown> }
  )?.fields;
  const tenant =
    ((rootFields?.key as { fields?: Record<string, unknown> } | undefined)
      ?.fields?.tenant as string) || "stillness";
  const linkedEntries = await collectLinkedObjectEntries(
    client,
    dynamicNodes,
    tenant,
  );
  const energySourceId =
    (rootFields?.energy_source_id as string | undefined) || null;
  const energyEntries = await collectEnergySourceEntries(
    client,
    energySourceId,
    tenant,
  );
  const resourceEntries = normalizeEntries([
    ...contentEntries,
    ...dynamicEntries,
    ...linkedEntries,
    ...energyEntries,
  ]);
  const contentMeta = buildContentPreview(result.data.content);
  const dynamicMeta = buildDynamicFieldPreview(dynamicFieldsResult);

  return {
    objectId: result.data.objectId,
    objectType: result.data.type || "Unknown",
    suiOwnerMode: parseOwner(result.data.owner),
    gameplayOwner: assemblyOwner?.name || "Unknown Rider",
    gameplayOwnerAddress:
      assemblyOwner?.address || assemblyOwner?.id || "Unavailable",
    status: parseStatus(result.data.content),
    version: String(result.data.version),
    digest: result.data.digest,
    updatedAt: new Date().toISOString(),
    inventory: extractInventory(result.data.content),
    resourceEntries,
    contentPreview: contentMeta.preview,
    contentKeys: contentMeta.keys,
    dynamicFieldCount: dynamicMeta.count,
    dynamicFieldPreview: dynamicMeta.preview,
  };
}
