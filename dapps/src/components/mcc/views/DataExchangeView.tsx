import { useState } from "react";

type ActionResult = {
  ok: boolean;
  message: string;
};

type DataExchangeViewProps = {
  t1ProbeCount: number;
  riderRole: "normal" | "owner";
  standing: number;
  standingTierLabel: string;
  withdrawalsUsed: number;
  withdrawalLimit: number;
  mtcBalance: number;
  activeScan: {
    id: string;
    targetId: string;
    targetLabel: string;
    systemLabel: string;
    targetBodyType: string;
    remainingSeconds: number;
    potentialStanding: number;
    potentialMtc: number;
  } | null;
  pendingDataItems: Array<{
    id: string;
    targetLabel: string;
    rarity: string;
    qualityScore: number;
    itemIntegrity: number;
    createdAt: string;
    potentialStanding: number;
    potentialMtc: number;
  }>;
  availableTargets: Array<{
    id: string;
    label: string;
    systemLabel: string;
    brief: string;
    scanDurationSeconds: number;
    potentialStanding: number;
    potentialMtc: number;
  }>;
  onClaimProbe: () => Promise<ActionResult>;
  onStartScan: (targetId: string) => Promise<ActionResult>;
  onRedeemDataItem: (resultId: string) => Promise<ActionResult>;
};

function formatTimestamp(value: string) {
  return new Date(value).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function DataExchangeView({
  t1ProbeCount,
  riderRole,
  standing,
  standingTierLabel,
  withdrawalsUsed,
  withdrawalLimit,
  mtcBalance,
  activeScan,
  pendingDataItems,
  availableTargets,
  onClaimProbe,
  onStartScan,
  onRedeemDataItem,
}: DataExchangeViewProps) {
  const [note, setNote] = useState(
    "Claim a free T1 probe, route it to a target, then redeem the captured packet through Macana.",
  );
  const [status, setStatus] = useState<"idle" | "active" | "error">("idle");
  const [busy, setBusy] = useState(false);

  const runAction = async (action: () => Promise<ActionResult>) => {
    setBusy(true);

    try {
      const result = await action();
      setStatus(result.ok ? "active" : "error");
      setNote(result.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="module-view">
      <h2>Data Exchange</h2>
      <p>
        Riders claim T1 probes, scan live targets, and redeem accepted data
        packets for standing and MTC through the station backend.
      </p>

      <div className="module-grid">
        <article className="module-card">
          <p className="module-label">Probe Access</p>
          <h3>T1 Claim Window</h3>
          <div className="kv-grid">
            <p>Rider Role</p>
            <p>{riderRole}</p>
            <p>T1 Inventory</p>
            <p>{t1ProbeCount}</p>
            <p>Daily Claims</p>
            <p>
              {withdrawalsUsed} / {withdrawalLimit}
            </p>
          </div>
          <div className="crafting-actions">
            <button
              onClick={() => void runAction(onClaimProbe)}
              disabled={busy}
            >
              Claim Free T1
            </button>
          </div>
        </article>

        <article className="module-card">
          <p className="module-label">Scan Routing</p>
          <h3>Scan Target Routing</h3>
          <div className="kv-grid">
            <p>Standing</p>
            <p>{standing}</p>
            <p>Standing Tier</p>
            <p>{standingTierLabel}</p>
            <p>Active Scan</p>
            <p>{activeScan ? activeScan.targetLabel : "NONE"}</p>
          </div>

          {activeScan ? (
            <p className="craft-note active">
              {activeScan.targetLabel} in {activeScan.systemLabel}. Signal lock
              resolves in {activeScan.remainingSeconds}s. Backend payout path:
              standing +{activeScan.potentialStanding}
              {activeScan.potentialMtc > 0
                ? ` / MTC up to ${activeScan.potentialMtc}`
                : " / standing-only packet"}
              .
            </p>
          ) : null}

          <div className="target-list">
            {availableTargets.map((target) => (
              <div key={target.id} className="target-row">
                <div>
                  <p>{target.label}</p>
                  <span>{target.systemLabel}</span>
                </div>
                <div className="target-meta">
                  <span>{target.scanDurationSeconds}s</span>
                  <span>Standing +{target.potentialStanding}</span>
                  <span>
                    {target.potentialMtc > 0
                      ? `MTC up to ${target.potentialMtc}`
                      : "standing-only"}
                  </span>
                </div>
                <span>{target.brief}</span>
                <button
                  onClick={() => void runAction(() => onStartScan(target.id))}
                  disabled={busy || !!activeScan || t1ProbeCount < 1}
                >
                  Start T1 Scan
                </button>
              </div>
            ))}
          </div>
        </article>

        <article className="module-card">
          <p className="module-label">Exchange Channel</p>
          <h3>Data Redemption</h3>
          <div className="kv-grid">
            <p>Standing</p>
            <p>{standing}</p>
            <p>MTC Wallet</p>
            <p>{mtcBalance}</p>
            <p>Pending Data Items</p>
            <p>{pendingDataItems.length}</p>
          </div>

          <div className="result-list">
            {pendingDataItems.length > 0 ? (
              pendingDataItems.map((result) => (
                <div key={result.id} className="result-row">
                  <div>
                    <p>{result.targetLabel}</p>
                    <span>
                      Captured {formatTimestamp(result.createdAt)} /
                      {result.rarity.toUpperCase()} / Q{result.qualityScore} /
                      integrity {result.itemIntegrity}%
                      {result.potentialMtc > 0
                        ? ` / MTC up to ${result.potentialMtc}`
                        : ` / Standing +${result.potentialStanding}`}
                    </span>
                  </div>
                  <button
                    onClick={() =>
                      void runAction(() => onRedeemDataItem(result.id))
                    }
                    disabled={busy}
                  >
                    Redeem Packet
                  </button>
                </div>
              ))
            ) : (
              <p className="queue-empty">
                No captured data packets waiting for redemption.
              </p>
            )}
          </div>

          <p className={`craft-note ${status}`}>{note}</p>
        </article>
      </div>
    </section>
  );
}
