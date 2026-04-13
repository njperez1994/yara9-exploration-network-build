import { useCallback, useEffect, useMemo, useState } from "react";
import { SuiJsonRpcClient } from "@mysten/sui/jsonRpc";
import { fetchStorageSnapshot, type StorageInventory } from "../storage-utils";
import { CraftingView } from "../crafting/CraftingView";
import { buildCraftingCatalog } from "../crafting/craftingCatalog";
import type { CraftingItem, CraftingResource } from "../crafting/types";

type IndustrialCraftingViewProps = {
  riderRole: "normal" | "owner";
  fabricationJobs: Array<{
    id: string;
    itemId: string;
    itemLabel: string;
    buildAction: "live" | "mock";
    buildDurationSeconds: number;
    startedAt: string;
    readyAt: string;
  }>;
  onQueueBuild: (itemId: string) => Promise<{
    ok: boolean;
    message: string;
  }>;
};

type BuildPanelState = {
  activeItemLabel: string | null;
  timeLabel: string;
  message: string;
  queueCount: number;
  state: "idle" | "active" | "error" | "completed";
};

type PanelFeedback = Pick<
  BuildPanelState,
  "activeItemLabel" | "message" | "state"
> | null;

const DEFAULT_STORAGE_OBJECT_ID =
  "0xf690dbcaecf948a74136276bf0800959bacb34d2d7b2e6e96b6f22fa061523bc";

function formatTimeLabel(totalSeconds: number) {
  const value = Math.max(0, totalSeconds);
  const hours = Math.floor(value / 3600)
    .toString()
    .padStart(2, "0");
  const minutes = Math.floor((value % 3600) / 60)
    .toString()
    .padStart(2, "0");
  const seconds = Math.floor(value % 60)
    .toString()
    .padStart(2, "0");

  return `${hours}h ${minutes}m ${seconds}s`;
}

function sumReservedMaterials(
  entries: Array<{ resources: CraftingResource[] }>,
): StorageInventory {
  return entries.reduce(
    (inventory, entry) => {
      for (const resource of entry.resources) {
        if (resource.amount <= 0) {
          continue;
        }

        // Reserve tracked resources locally while builds are queued so the UI
        // cannot enqueue more batches than the storage can actually support.
        if (resource.id === "felspar") {
          inventory.felspar += resource.amount;
        }

        if (resource.id === "platinum") {
          inventory.platinum += resource.amount;
        }

        if (resource.id === "printed") {
          inventory.circuits += resource.amount;
        }

        if (resource.id === "salvaged") {
          inventory.salvaged += resource.amount;
        }
      }

      return inventory;
    },
    { felspar: 0, platinum: 0, circuits: 0, salvaged: 0 },
  );
}

export function IndustrialCraftingView({
  riderRole,
  fabricationJobs,
  onQueueBuild,
}: IndustrialCraftingViewProps) {
  const storageObjectId =
    import.meta.env.VITE_STORAGE_OBJECT_ID || DEFAULT_STORAGE_OBJECT_ID;
  const rpcUrl =
    import.meta.env.VITE_SUI_RPC_URL || "https://fullnode.testnet.sui.io:443";
  const networkName = import.meta.env.VITE_SUI_NETWORK || "testnet";

  const [availableMaterials, setAvailableMaterials] =
    useState<StorageInventory>({
      felspar: 0,
      platinum: 0,
      circuits: 0,
      salvaged: 0,
    });
  const [busyItemId, setBusyItemId] = useState<string | null>(null);
  const [panelFeedback, setPanelFeedback] = useState<PanelFeedback>(null);
  const [now, setNow] = useState(Date.now());

  const client = useMemo(
    () => new SuiJsonRpcClient({ url: rpcUrl, network: networkName as any }),
    [networkName, rpcUrl],
  );

  const refreshInventory = useCallback(async () => {
    try {
      const snapshot = await fetchStorageSnapshot(client, storageObjectId);
      setAvailableMaterials(snapshot.inventory);
    } catch {
      setPanelFeedback({
        activeItemLabel: null,
        message: "Storage sync unavailable",
        state: "error",
      });
    }
  }, [client, storageObjectId]);

  useEffect(() => {
    void refreshInventory();
  }, [refreshInventory]);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, []);

  useEffect(() => {
    if (fabricationJobs.length > 0) {
      setPanelFeedback(null);
    }
  }, [fabricationJobs.length]);

  const baseItems = useMemo(
    () =>
      buildCraftingCatalog({
        felspar: availableMaterials.felspar,
        platinum: availableMaterials.platinum,
        circuits: availableMaterials.circuits,
        salvaged: availableMaterials.salvaged,
        riderRole,
      }),
    [
      availableMaterials.circuits,
      availableMaterials.felspar,
      availableMaterials.platinum,
      availableMaterials.salvaged,
      riderRole,
    ],
  );

  const resourcesByItemId = useMemo(
    () => new Map(baseItems.map((item) => [item.id, item.resources] as const)),
    [baseItems],
  );

  const reservedMaterials = useMemo(
    () =>
      sumReservedMaterials(
        fabricationJobs.map((job) => ({
          resources: resourcesByItemId.get(job.itemId) ?? [],
        })),
      ),
    [fabricationJobs, resourcesByItemId],
  );

  const netAvailableMaterials = useMemo(
    () => ({
      felspar: Math.max(
        0,
        availableMaterials.felspar - reservedMaterials.felspar,
      ),
      platinum: Math.max(
        0,
        availableMaterials.platinum - reservedMaterials.platinum,
      ),
      circuits: Math.max(
        0,
        availableMaterials.circuits - reservedMaterials.circuits,
      ),
      salvaged: Math.max(
        0,
        availableMaterials.salvaged - reservedMaterials.salvaged,
      ),
    }),
    [availableMaterials, reservedMaterials],
  );

  const items = useMemo(
    () =>
      buildCraftingCatalog({
        felspar: netAvailableMaterials.felspar,
        platinum: netAvailableMaterials.platinum,
        circuits: netAvailableMaterials.circuits,
        salvaged: netAvailableMaterials.salvaged,
        riderRole,
      }),
    [
      netAvailableMaterials.circuits,
      netAvailableMaterials.felspar,
      netAvailableMaterials.platinum,
      netAvailableMaterials.salvaged,
      riderRole,
    ],
  );

  const panelState = useMemo<BuildPanelState>(() => {
    if (fabricationJobs.length > 0) {
      const totalRemaining = Math.max(
        0,
        Math.ceil(
          (new Date(
            fabricationJobs[fabricationJobs.length - 1].readyAt,
          ).getTime() -
            now) /
            1000,
        ),
      );

      return {
        activeItemLabel: fabricationJobs[0]?.itemLabel ?? null,
        timeLabel: formatTimeLabel(totalRemaining),
        message:
          fabricationJobs.length > 1
            ? `${fabricationJobs.length} builds queued`
            : "Fabrication countdown active",
        queueCount: fabricationJobs.length,
        state: "active",
      };
    }

    if (panelFeedback) {
      return {
        activeItemLabel: panelFeedback.activeItemLabel,
        timeLabel: "00h 00m 00s",
        message: panelFeedback.message,
        queueCount: 0,
        state: panelFeedback.state,
      };
    }

    return {
      activeItemLabel: null,
      timeLabel: "00h 00m 00s",
      message: "Build queue idle",
      queueCount: 0,
      state: "idle",
    };
  }, [fabricationJobs, now, panelFeedback]);

  const handleBuild = useCallback(
    async (item: CraftingItem) => {
      if (!item.canBuild) {
        // Reuse the item-level block reason so the panel and CTA stay in sync
        // when access is denied by role gating instead of missing resources.
        const blockedMessage = item.blockedReason || "Insufficient resources";

        setPanelFeedback({
          activeItemLabel: item.tierLabel,
          message: blockedMessage,
          state: "error",
        });
        window.alert(blockedMessage);
        return;
      }

      setBusyItemId(item.id);

      try {
        const result = await onQueueBuild(item.id);

        if (!result.ok) {
          setPanelFeedback({
            activeItemLabel: item.tierLabel,
            message: result.message,
            state: "error",
          });
          window.alert(result.message);
        }
      } finally {
        setBusyItemId(null);
      }
    },
    [onQueueBuild],
  );

  return (
    <CraftingView
      items={items}
      busyItemId={busyItemId}
      buildPanel={panelState}
      onBuild={(item) => void handleBuild(item)}
    />
  );
}
