import { useCallback, useEffect, useMemo, useState } from "react";
import { SuiJsonRpcClient } from "@mysten/sui/jsonRpc";
import { fetchStorageSnapshot, type StorageInventory } from "../storage-utils";

type CraftingStatus = "idle" | "loading" | "active" | "error" | "completed";

type IndustrialCraftingViewProps = {
  riderRole: "normal" | "owner";
  t1ProbeCount: number;
  onCraftT1: () => Promise<{
    ok: boolean;
    message: string;
  }>;
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
  riderRole,
  t1ProbeCount,
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
  const [availableMaterials, setAvailableMaterials] =
    useState<StorageInventory>({
      felspar: 0,
      platinum: 0,
    });
  const [note, setNote] = useState(
    "Awaiting material verification from storage.",
  );

  const requirements = useMemo(() => ({ felspar: 100, platinum: 25 }), []);

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
      setAvailableMaterials(snapshot.inventory);
      const feldsparIcon =
        snapshot.resourceEntries.find((entry) => entry.typeId === "77800")
          ?.iconUrl || null;
      const platinumIcon =
        snapshot.resourceEntries.find((entry) => entry.typeId === "77810")
          ?.iconUrl || null;
      setMaterialIcons({ feldspar: feldsparIcon, platinum: platinumIcon });
      setStatus("active");
      setNote(
        `Storage snapshot synced. ${snapshot.inventory.felspar} FE and ${snapshot.inventory.platinum} PP available for owner-issued T1 batches.`,
      );
    } catch (error) {
      setStatus("error");
      setNote(
        error instanceof Error
          ? error.message
          : "Failed to read storage inventory.",
      );
    }
  }, [client, storageObjectId]);

  useEffect(() => {
    refreshInventory();
  }, [refreshInventory]);

  const craftModule = async () => {
    if (!hasMaterials) {
      setStatus("error");
      setNote("Insufficient materials. Load more resources into storage.");
      return;
    }

    if (riderRole !== "owner") {
      setStatus("error");
      setNote("Owner clearance required for backend T1 fabrication.");
      return;
    }

    const crafted = await onCraftT1();
    if (!crafted.ok) {
      setStatus("error");
      setNote(crafted.message);
      return;
    }

    setStatus("completed");
    setNote(crafted.message);
  };

  return (
    <section className="module-view">
      <h2>Industrial Crafting</h2>
      <p>
        Read live storage materials and let the owner mint T1 probe batches into
        the persisted rider inventory.
      </p>

      <div className="module-grid">
        <article className="module-card">
          <p className="module-label">Recipe: Survey Satellite T1</p>
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
          <p className="module-label">Macana Fabrication Control</p>
          <div className="kv-grid">
            <p>Access Role</p>
            <p>{riderRole}</p>
            <p>T1 Probe Inventory</p>
            <p>{t1ProbeCount}</p>
          </div>

          {riderRole === "owner" ? (
            <p className="craft-note active">
              Owner-issued fabrication writes directly to the Supabase backend
              and never exposes privileged keys in the browser.
            </p>
          ) : (
            <p className="queue-empty">
              Fabrication is backend-gated to the configured owner wallet.
            </p>
          )}

          {!hasMaterials ? (
            <p className="lock-banner">
              Fabrication locked: required resources not available in storage.
            </p>
          ) : null}

          <div className="crafting-actions">
            <button onClick={refreshInventory} disabled={status === "loading"}>
              {status === "loading" ? "Syncing..." : "Sync Inventory"}
            </button>
            <button
              onClick={() => void craftModule()}
              disabled={
                !hasMaterials || status === "loading" || riderRole !== "owner"
              }
            >
              Issue T1 Batch
            </button>
          </div>

          <p className={`craft-note ${status}`}>{note}</p>
        </article>
      </div>
    </section>
  );
}
