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
    scanDurationSeconds: number;
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

function getSignalClass(value: number) {
  if (value >= 5) {
    return "high";
  }

  if (value >= 1) {
    return "medium";
  }

  return "low";
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

  const claimProgress = Math.min(
    100,
    withdrawalLimit > 0 ? (withdrawalsUsed / withdrawalLimit) * 100 : 0,
  );
  const scanProgress = activeScan
    ? Math.min(
        100,
        ((activeScan.scanDurationSeconds - activeScan.remainingSeconds) /
          activeScan.scanDurationSeconds) *
          100,
      )
    : 0;

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
        <article className="module-card exchange-hero-card">
          <div className="exchange-hero-header">
            <div>
              <p className="module-label">Operational Loop</p>
              <h3>Frontier Packet Cycle</h3>
            </div>
            <span className={`signal-chip ${busy ? "medium" : status}`}>
              {busy ? "TRANSMITTING" : activeScan ? "ACTIVE SCAN" : "READY"}
            </span>
          </div>

          <div className="exchange-cycle-strip" aria-label="Loop sequence">
            <span className={t1ProbeCount > 0 ? "complete" : "active"}>
              1 CLAIM
            </span>
            <span
              className={
                activeScan
                  ? "active"
                  : pendingDataItems.length > 0
                    ? "complete"
                    : "idle"
              }
            >
              2 ROUTE
            </span>
            <span className={pendingDataItems.length > 0 ? "active" : "idle"}>
              3 REDEEM
            </span>
          </div>

          <div className="exchange-hero-metrics">
            <div className="exchange-metric-card">
              <span>Probe Stock</span>
              <strong>{t1ProbeCount}</strong>
              <small>free public T1 access</small>
            </div>
            <div className="exchange-metric-card">
              <span>Standing Tier</span>
              <strong>{standingTierLabel}</strong>
              <small>{standing} standing points</small>
            </div>
            <div className="exchange-metric-card">
              <span>Redeem Queue</span>
              <strong>{pendingDataItems.length}</strong>
              <small>{mtcBalance} MTC in rider wallet</small>
            </div>
          </div>

          <p className={`craft-note ${status}`}>{note}</p>
        </article>

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
          <div className="meter-block">
            <div className="meter-track">
              <span style={{ width: `${claimProgress}%` }} />
            </div>
            <small>
              {Math.max(0, withdrawalLimit - withdrawalsUsed)} claims remain
              this station day
            </small>
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
          <h3>Target Routing</h3>
          <div className="kv-grid">
            <p>Standing</p>
            <p>{standing}</p>
            <p>Standing Tier</p>
            <p>{standingTierLabel}</p>
            <p>Active Scan</p>
            <p>{activeScan ? activeScan.targetLabel : "NONE"}</p>
          </div>

          {activeScan ? (
            <div className="active-scan-panel">
              <div className="active-scan-heading">
                <strong>{activeScan.targetLabel}</strong>
                <span>{activeScan.systemLabel}</span>
              </div>
              <div className="meter-track scan-progress">
                <span style={{ width: `${scanProgress}%` }} />
              </div>
              <p className="craft-note active">
                Signal lock resolves in {activeScan.remainingSeconds}s. Backend
                payout path: standing +{activeScan.potentialStanding}
                {activeScan.potentialMtc > 0
                  ? ` / MTC up to ${activeScan.potentialMtc}`
                  : " / standing-only packet"}
                .
              </p>
            </div>
          ) : null}

          <div className="target-list">
            {availableTargets.map((target) => (
              <div key={target.id} className="target-row target-row-rich">
                <div>
                  <div className="target-heading">
                    <p>{target.label}</p>
                    <span
                      className={`signal-chip ${getSignalClass(target.potentialMtc)}`}
                    >
                      {target.potentialMtc > 0 ? "MTC YIELD" : "STANDING"}
                    </span>
                  </div>
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
                <span className="target-brief">{target.brief}</span>
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
                <div key={result.id} className="result-row result-row-rich">
                  <div>
                    <div className="target-heading">
                      <p>{result.targetLabel}</p>
                      <span
                        className={`signal-chip ${getSignalClass(result.potentialMtc)}`}
                      >
                        {result.rarity.toUpperCase()}
                      </span>
                    </div>
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
        </article>
      </div>
    </section>
  );
}
