import { useCallback, useEffect, useMemo, useState } from "react";
import { SuiJsonRpcClient } from "@mysten/sui/jsonRpc";
import { fetchStorageSnapshot, type StorageSnapshot } from "../storage-utils";

type ViewState = "idle" | "loading" | "active" | "error";

const DEFAULT_STORAGE_OBJECT_ID =
  "0xf690dbcaecf948a74136276bf0800959bacb34d2d7b2e6e96b6f22fa061523bc";

function resourceCode(label: string): string {
  const normalized = label.toLowerCase();
  if (normalized.includes("feldspar")) return "FE";
  if (normalized.includes("platinumpalladium")) return "PP";
  if (normalized.includes("water ice")) return "WI";
  if (normalized.includes("fuel")) return "FU";
  return "RS";
}

function ResourceGlyph({
  iconUrl,
  label,
}: {
  iconUrl?: string;
  label: string;
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

  return <span className="resource-code">{resourceCode(label)}</span>;
}

export function StorageLiveView() {
  const storageObjectId =
    import.meta.env.VITE_STORAGE_OBJECT_ID || DEFAULT_STORAGE_OBJECT_ID;
  const rpcUrl =
    import.meta.env.VITE_SUI_RPC_URL || "https://fullnode.testnet.sui.io:443";
  const networkName = import.meta.env.VITE_SUI_NETWORK || "testnet";

  const [viewState, setViewState] = useState<ViewState>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [snapshot, setSnapshot] = useState<StorageSnapshot | null>(null);

  const client = useMemo(
    () => new SuiJsonRpcClient({ url: rpcUrl, network: networkName as any }),
    [networkName, rpcUrl],
  );

  const loadStorage = useCallback(async () => {
    setViewState("loading");
    setErrorMessage(null);

    try {
      const nextSnapshot = await fetchStorageSnapshot(client, storageObjectId);
      setSnapshot(nextSnapshot);
      setViewState("active");
    } catch (error) {
      setViewState("error");
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Failed to load storage object.",
      );
    }
  }, [client, storageObjectId]);

  useEffect(() => {
    loadStorage();
  }, [loadStorage]);

  const inventoryRows = (snapshot?.resourceEntries || []).filter(
    (entry) =>
      entry.source === "linked_object" || entry.source === "dynamic_field",
  );
  const fuelRows = (snapshot?.resourceEntries || []).filter(
    (entry) => entry.source === "energy_source",
  );

  return (
    <section className="module-view">
      <h2>Storage Unit</h2>
      <p>Live inventory and energy data from your Smart Storage Unit.</p>

      <div className="module-grid">
        <article className="module-card live-storage-card">
          <p className="module-label">Connection</p>
          <h3>{viewState.toUpperCase()}</h3>
          <div className="kv-grid">
            <p>Owner</p>
            <p>{snapshot?.gameplayOwner || "-"}</p>
            <p>Updated</p>
            <p>{snapshot?.updatedAt || "-"}</p>
          </div>
          <button onClick={loadStorage} disabled={viewState === "loading"}>
            {viewState === "loading" ? "Refreshing..." : "Refresh"}
          </button>
          {errorMessage ? (
            <p className="storage-error">{errorMessage}</p>
          ) : null}
        </article>

        <article className="module-card live-storage-card">
          <p className="module-label">Primary Inventory</p>
          <h3>Resources</h3>
          <div className="resource-list">
            {inventoryRows.length ? (
              inventoryRows.map((entry) => (
                <div
                  key={`${entry.label}-${entry.typeId}-${entry.source}-${entry.debugKey || ""}`}
                  className="resource-row simple"
                >
                  <ResourceGlyph iconUrl={entry.iconUrl} label={entry.label} />
                  <p>{entry.label}</p>
                  <p>{entry.amount}</p>
                </div>
              ))
            ) : (
              <p className="storage-error">No inventory resources detected.</p>
            )}
          </div>
        </article>

        <article className="module-card live-storage-card">
          <p className="module-label">Network Node</p>
          <h3>Fuel / Energy</h3>
          <div className="resource-list">
            {fuelRows.length ? (
              fuelRows.map((entry) => (
                <div
                  key={`${entry.label}-${entry.typeId}-${entry.source}-${entry.debugKey || ""}`}
                  className="resource-row simple"
                >
                  <ResourceGlyph iconUrl={entry.iconUrl} label={entry.label} />
                  <p>{entry.label}</p>
                  <p>{entry.amount}</p>
                </div>
              ))
            ) : (
              <p className="storage-error">No fuel data detected.</p>
            )}
          </div>
        </article>
      </div>
    </section>
  );
}
