import { getAssemblyWithOwner } from "@evefrontier/dapp-kit";
import { SuiJsonRpcClient } from "@mysten/sui/jsonRpc";

export type StorageInventory = {
  felspar: number;
  platinum: number;
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
};

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
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function extractAmountFromNode(node: unknown): number | null {
  if (!node || typeof node !== "object") return asNumber(node);
  const record = node as Record<string, unknown>;

  const amountKeys = ["amount", "quantity", "count", "value", "balance", "qty"];
  for (const key of amountKeys) {
    const parsed = asNumber(record[key]);
    if (parsed !== null) return parsed;
  }

  if (record.fields && typeof record.fields === "object") {
    return extractAmountFromNode(record.fields);
  }

  return null;
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
  };
}
