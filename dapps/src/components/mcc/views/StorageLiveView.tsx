import { useCallback, useEffect, useMemo, useState } from "react";
import { SuiJsonRpcClient } from "@mysten/sui/jsonRpc";
import { getAssemblyWithOwner } from "@evefrontier/dapp-kit";

type ViewState = "idle" | "loading" | "active" | "error";

type StorageSnapshot = {
  objectId: string;
  objectType: string;
  suiOwnerMode: string;
  gameplayOwner: string;
  gameplayOwnerAddress: string;
  version: string;
  digest: string;
  status: string;
  updatedAt: string;
};

const DEFAULT_STORAGE_OBJECT_ID =
  "0xf690dbcaecf948a74136276bf0800959bacb34d2d7b2e6e96b6f22fa061523bc";

function parseOwner(owner: unknown): string {
  if (!owner || typeof owner !== "object") return "Unknown";

  const value = owner as Record<string, unknown>;
  if (typeof value.AddressOwner === "string") {
    return `Address ${value.AddressOwner}`;
  }
  if (typeof value.ObjectOwner === "string") {
    return `Object ${value.ObjectOwner}`;
  }
  if (value.Shared) {
    return "Shared";
  }
  if (value.Immutable) {
    return "Immutable";
  }

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
      const [result, ownerResult] = await Promise.all([
        client.getObject({
          id: storageObjectId,
          options: {
            showType: true,
            showOwner: true,
            showContent: true,
          },
        }),
        getAssemblyWithOwner(storageObjectId),
      ]);

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
        }
      ).assemblyOwner;

      setSnapshot({
        objectId: result.data.objectId,
        objectType: result.data.type || "Unknown",
        suiOwnerMode: parseOwner(result.data.owner),
        gameplayOwner: assemblyOwner?.name || "Unknown Rider",
        gameplayOwnerAddress:
          assemblyOwner?.address || assemblyOwner?.id || "Unavailable",
        version: String(result.data.version),
        digest: result.data.digest,
        status: parseStatus(result.data.content),
        updatedAt: new Date().toISOString(),
      });
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
