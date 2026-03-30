import { useCallback, useEffect, useMemo, useState } from "react";
import { SuiJsonRpcClient } from "@mysten/sui/jsonRpc";
import { fetchStorageSnapshot, type StorageInventory } from "../storage-utils";

type CraftingStatus = "idle" | "loading" | "active" | "error" | "completed";

type IndustrialCraftingViewProps = {
  requirements: StorageInventory;
  availableMaterials: StorageInventory;
  moduleCount: number;
  onInventorySync: (inventory: StorageInventory) => void;
  onCraftT1: () => boolean;
};

const DEFAULT_STORAGE_OBJECT_ID =
  "0xf690dbcaecf948a74136276bf0800959bacb34d2d7b2e6e96b6f22fa061523bc";

function MaterialIcon({
  iconUrl,
  label,
  code,
}: {
  iconUrl: string | null;
  label: string;
  code: string;
}) {
  const [iconFailed, setIconFailed] = useState(false);

  if (iconUrl && !iconFailed) {
    return (
      <img
        src={iconUrl}
        alt={label}
        className="resource-icon"
        onError={() => setIconFailed(true)}
      />
    );
  }

  return <span className="resource-code">{code}</span>;
}

export function IndustrialCraftingView({
  requirements,
  availableMaterials,
  moduleCount,
  onInventorySync,
  onCraftT1,
}: IndustrialCraftingViewProps) {
  const storageObjectId =
    import.meta.env.VITE_STORAGE_OBJECT_ID || DEFAULT_STORAGE_OBJECT_ID;
  const rpcUrl =
    import.meta.env.VITE_SUI_RPC_URL || "https://fullnode.testnet.sui.io:443";
  const networkName = import.meta.env.VITE_SUI_NETWORK || "testnet";

  const [status, setStatus] = useState<CraftingStatus>("idle");
  const [materialIcons, setMaterialIcons] = useState<{
    feldspar: string | null;
    platinum: string | null;
  }>({
    feldspar: null,
    platinum: null,
  });
  const [note, setNote] = useState(
    "Awaiting material verification from storage.",
  );

  const client = useMemo(
    () => new SuiJsonRpcClient({ url: rpcUrl, network: networkName as any }),
    [networkName, rpcUrl],
  );

  const hasMaterials =
    availableMaterials.felspar >= requirements.felspar &&
    availableMaterials.platinum >= requirements.platinum;
  const hasFeldspar = availableMaterials.felspar >= requirements.felspar;
  const hasPlatinum = availableMaterials.platinum >= requirements.platinum;

  const refreshInventory = useCallback(async () => {
    setStatus("loading");
    setNote("Syncing storage inventory...");

    try {
      const snapshot = await fetchStorageSnapshot(client, storageObjectId);
      onInventorySync(snapshot.inventory);
      const feldsparIcon =
        snapshot.resourceEntries.find((entry) => entry.typeId === "77800")
          ?.iconUrl || null;
      const platinumIcon =
        snapshot.resourceEntries.find((entry) => entry.typeId === "77810")
          ?.iconUrl || null;
      setMaterialIcons({ feldspar: feldsparIcon, platinum: platinumIcon });
      setStatus("active");
      setNote(
        `Storage synced. Feldspar Crystals ${snapshot.inventory.felspar}, PlatinumPalladium Matrix ${snapshot.inventory.platinum}.`,
      );
    } catch (error) {
      setStatus("error");
      setNote(
        error instanceof Error
          ? error.message
          : "Failed to read storage inventory.",
      );
    }
  }, [client, onInventorySync, storageObjectId]);

  useEffect(() => {
    refreshInventory();
  }, [refreshInventory]);

  const craftModule = () => {
    if (!hasMaterials) {
      setStatus("error");
      setNote(
        "Insufficient materials. Load more Feldspar Crystals and PlatinumPalladium Matrix into storage.",
      );
      return;
    }

    const crafted = onCraftT1();
    if (!crafted) {
      setStatus("error");
      setNote("Crafting lock failed. Re-sync storage and try again.");
      return;
    }

    setStatus("completed");
    setNote("Satellite Module T1 fabricated and queued for scan operations.");
  };

  return (
    <section className="module-view">
      <h2>Industrial Crafting</h2>
      <p>Forge Tier 1 satellite modules from live storage inventory.</p>

      <div className="module-grid">
        <article className="module-card">
          <p className="module-label">Recipe: Satellite Module T1</p>
          <h3>Material Requirements</h3>
          <div className="material-status-list">
            <div className={`material-row ${hasFeldspar ? "ok" : "missing"}`}>
              <p className="material-name">
                <MaterialIcon
                  iconUrl={materialIcons.feldspar}
                  label="Feldspar Crystals"
                  code="FE"
                />
                Feldspar Crystals
              </p>
              <p>
                {availableMaterials.felspar} / {requirements.felspar}
              </p>
              <span>{hasFeldspar ? "OK" : "MISSING"}</span>
            </div>
            <div className={`material-row ${hasPlatinum ? "ok" : "missing"}`}>
              <p className="material-name">
                <MaterialIcon
                  iconUrl={materialIcons.platinum}
                  label="PlatinumPalladium Matrix"
                  code="PP"
                />
                PlatinumPalladium Matrix
              </p>
              <p>
                {availableMaterials.platinum} / {requirements.platinum}
              </p>
              <span>{hasPlatinum ? "OK" : "MISSING"}</span>
            </div>
          </div>
        </article>

        <article className="module-card">
          <p className="module-label">CRAFTING MODULE</p>
          <div className="kv-grid">
            <p>Modules Ready</p>
            <p>{moduleCount}</p>
          </div>

          {!hasMaterials ? (
            <p className="lock-banner">
              Crafting locked: required resources not available in storage.
            </p>
          ) : null}

          <div className="crafting-actions">
            <button onClick={refreshInventory} disabled={status === "loading"}>
              {status === "loading" ? "Syncing..." : "Sync Inventory"}
            </button>
            <button
              onClick={craftModule}
              disabled={!hasMaterials || status === "loading"}
            >
              Craft T1 Module
            </button>
          </div>
        </article>
      </div>
    </section>
  );
}
