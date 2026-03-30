import { useCallback, useEffect, useMemo, useState } from "react";
import { SuiJsonRpcClient } from "@mysten/sui/jsonRpc";
import { fetchStorageSnapshot, type StorageSnapshot } from "../storage-utils";

type ViewState = "idle" | "loading" | "active" | "error";

const DEFAULT_STORAGE_OBJECT_ID =
  "0xf690dbcaecf948a74136276bf0800959bacb34d2d7b2e6e96b6f22fa061523bc";

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

  return (
    <section className="module-view">
      <h2>Storage Live</h2>
      <p>Live connection to a real Smart Storage object from the network.</p>

      <div className="module-grid">
        <article className="module-card live-storage-card">
          <p className="module-label">View State</p>
          <h3>{viewState.toUpperCase()}</h3>
          <p>RPC: {rpcUrl}</p>
          <p className="storage-id">Object: {storageObjectId}</p>
          <button onClick={loadStorage} disabled={viewState === "loading"}>
            {viewState === "loading" ? "Refreshing..." : "Refresh"}
          </button>
          {errorMessage ? (
            <p className="storage-error">{errorMessage}</p>
          ) : null}
        </article>

        {snapshot ? (
          <article className="module-card live-storage-card">
            <p className="module-label">On-chain Snapshot</p>
            <div className="kv-grid">
              <p>Type</p>
              <p>{snapshot.objectType}</p>
              <p>Sui Owner Mode</p>
              <p>{snapshot.suiOwnerMode}</p>
              <p>Gameplay Owner</p>
              <p>{snapshot.gameplayOwner}</p>
              <p>Owner Address</p>
              <p className="storage-id">{snapshot.gameplayOwnerAddress}</p>
              <p>Status</p>
              <p>{snapshot.status}</p>
              <p>Felspar</p>
              <p>{snapshot.inventory.felspar}</p>
              <p>Platinum</p>
              <p>{snapshot.inventory.platinum}</p>
              <p>Version</p>
              <p>{snapshot.version}</p>
              <p>Digest</p>
              <p className="storage-id">{snapshot.digest}</p>
              <p>Updated</p>
              <p>{snapshot.updatedAt}</p>
            </div>
          </article>
        ) : null}
      </div>
    </section>
  );
}
