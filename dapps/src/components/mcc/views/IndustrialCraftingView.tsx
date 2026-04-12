import { useCallback, useEffect, useMemo, useState } from "react";
import { SuiJsonRpcClient } from "@mysten/sui/jsonRpc";
import { fetchStorageSnapshot, type StorageInventory } from "../storage-utils";
import { CraftingView } from "../crafting/CraftingView";
import { buildCraftingCatalog } from "../crafting/craftingCatalog";
import type { CraftingItem, CraftingResource } from "../crafting/types";

type IndustrialCraftingViewProps = {
  riderRole: "normal" | "owner";
  t1ProbeCount: number;
  onCraftT1: () => Promise<{
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

type BuildQueueEntry = {
  queueId: string;
  itemId: string;
  itemLabel: string;
  buildAction: CraftingItem["buildAction"];
  buildTime: number;
  resources: CraftingResource[];
};

type ActiveBuild = BuildQueueEntry & {
  endsAt: number;
};

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

function sumQueuedBuildTime(entries: BuildQueueEntry[]) {
  return entries.reduce((total, entry) => total + entry.buildTime, 0);
}

function sumReservedMaterials(
  entries: Array<Pick<BuildQueueEntry, "resources">>,
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
  t1ProbeCount: _t1ProbeCount,
  onCraftT1,
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
  const [queuedBuilds, setQueuedBuilds] = useState<BuildQueueEntry[]>([]);
  const [activeBuild, setActiveBuild] = useState<ActiveBuild | null>(null);
  const [panelState, setPanelState] = useState<BuildPanelState>({
    activeItemLabel: null,
    timeLabel: "00h 00m 00s",
    message: "Build queue idle",
    queueCount: 0,
    state: "idle",
  });
  const [isCompletingBuild, setIsCompletingBuild] = useState(false);
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
      setPanelState((current) => ({
        ...current,
        message: "Storage sync unavailable",
        state: "error",
      }));
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

  const reservedMaterials = useMemo(
    () =>
      sumReservedMaterials(
        activeBuild ? [activeBuild, ...queuedBuilds] : queuedBuilds,
      ),
    [activeBuild, queuedBuilds],
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

  useEffect(() => {
    if (activeBuild || queuedBuilds.length === 0 || isCompletingBuild) {
      return;
    }

    const [nextBuild, ...remainingBuilds] = queuedBuilds;

    // Builds execute one at a time so live crafting can write to the backend in
    // the same order the rider queued them from the station UI.
    setActiveBuild({
      ...nextBuild,
      endsAt: Date.now() + nextBuild.buildTime * 1000,
    });
    setQueuedBuilds(remainingBuilds);
  }, [activeBuild, isCompletingBuild, queuedBuilds]);

  useEffect(() => {
    if (!activeBuild) {
      if (queuedBuilds.length > 0) {
        setPanelState({
          activeItemLabel: queuedBuilds[0]?.itemLabel ?? null,
          timeLabel: formatTimeLabel(sumQueuedBuildTime(queuedBuilds)),
          message: "Build queue primed",
          queueCount: queuedBuilds.length,
          state: "active",
        });
      }

      return;
    }

    const remaining = Math.max(0, Math.ceil((activeBuild.endsAt - now) / 1000));
    const queueCount = queuedBuilds.length + 1;
    const totalRemaining = remaining + sumQueuedBuildTime(queuedBuilds);

    if (remaining === 0 || isCompletingBuild) {
      return;
    }

    setPanelState({
      activeItemLabel: activeBuild.itemLabel,
      timeLabel: formatTimeLabel(totalRemaining),
      message:
        queueCount > 1
          ? `${queueCount} builds queued`
          : "Fabrication countdown active",
      queueCount,
      state: "active",
    });
  }, [activeBuild, isCompletingBuild, now, queuedBuilds]);

  useEffect(() => {
    if (!activeBuild || isCompletingBuild) {
      return;
    }

    const remaining = Math.max(0, Math.ceil((activeBuild.endsAt - now) / 1000));

    if (remaining > 0) {
      return;
    }

    const completedBuild = activeBuild;

    void (async () => {
      setIsCompletingBuild(true);
      setBusyItemId(completedBuild.itemId);

      let completionState: BuildPanelState["state"] = "completed";
      let completionMessage = "Build cycle completed";

      if (completedBuild.buildAction === "live") {
        const result = await onCraftT1();

        if (!result.ok) {
          completionState = "error";
          completionMessage = result.message;
        } else {
          await refreshInventory();
        }
      }

      setBusyItemId(null);
      setIsCompletingBuild(false);
      setActiveBuild((current) =>
        current?.queueId === completedBuild.queueId ? null : current,
      );

      // The panel keeps a compact summary of the queue after each completed
      // cycle so riders can see the count drop as backend writes finish.
      if (queuedBuilds.length === 0) {
        setPanelState({
          activeItemLabel: completedBuild.itemLabel,
          timeLabel: "00h 00m 00s",
          message: completionMessage,
          queueCount: 0,
          state: completionState,
        });
      }

      if (completionState === "error") {
        window.alert(completionMessage);
      }
    })();
  }, [
    activeBuild,
    isCompletingBuild,
    now,
    onCraftT1,
    queuedBuilds.length,
    refreshInventory,
  ]);

  const handleBuild = useCallback(
    (item: CraftingItem) => {
      if (!item.canBuild) {
        // Reuse the item-level block reason so the panel and CTA stay in sync
        // when access is denied by role gating instead of missing resources.
        const blockedMessage = item.blockedReason || "Insufficient resources";

        setPanelState({
          activeItemLabel: item.tierLabel,
          timeLabel: "00h 00m 00s",
          message: blockedMessage,
          queueCount: activeBuild
            ? queuedBuilds.length + 1
            : queuedBuilds.length,
          state: "error",
        });
        window.alert(blockedMessage);
        return;
      }

      // Queue locally first and let the countdown finish before hitting the
      // live backend, which keeps multi-build timing and persistence aligned.
      setQueuedBuilds((current) => [
        ...current,
        {
          queueId: `${item.id}-${Date.now()}-${current.length}`,
          itemId: item.id,
          itemLabel: item.tierLabel,
          buildAction: item.buildAction,
          buildTime: item.buildTime,
          resources: item.resources,
        },
      ]);
    },
    [activeBuild, queuedBuilds.length],
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
