import { useState } from "react";

type ActionResult = {
  ok: boolean;
  message: string;
};

type DataExchangeViewProps = {
  corpPoolCount: number;
  riderReadySatelliteCount: number;
  riderExpiredSatelliteCount: number;
  standing: number;
  standingTierLabel: string;
  withdrawalsUsed: number;
  withdrawalLimit: number;
  mtcBalance: number;
  activeDeployment: {
    id: string;
    targetId: string;
    targetLabel: string;
    systemLabel: string;
    remainingSeconds: number;
    standingReward: number;
    mtcReward: number;
  } | null;
  pendingResults: Array<{
    id: string;
    targetLabel: string;
    standingAwarded: number;
    mtcAwarded: number;
    completedAt: string;
  }>;
  availableTargets: Array<{
    id: string;
    label: string;
    systemLabel: string;
    scanDurationSeconds: number;
    standingReward: number;
    mtcReward: number;
  }>;
  onWithdrawSatellite: () => ActionResult;
  onDeploySatellite: (targetId: string) => ActionResult;
  onSubmitScanResult: (resultId: string) => ActionResult;
};

function formatCompletedAt(value: string) {
  return new Date(value).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function DataExchangeView({
  corpPoolCount,
  riderReadySatelliteCount,
  riderExpiredSatelliteCount,
  standing,
  standingTierLabel,
  withdrawalsUsed,
  withdrawalLimit,
  mtcBalance,
  activeDeployment,
  pendingResults,
  availableTargets,
  onWithdrawSatellite,
  onDeploySatellite,
  onSubmitScanResult,
}: DataExchangeViewProps) {
  const [note, setNote] = useState(
    "Withdraw a free T1 satellite from the Macana pool, deploy it, then submit the scan packet.",
  );
  const [status, setStatus] = useState<"idle" | "active" | "error">("idle");

  const runAction = (result: ActionResult) => {
    setStatus(result.ok ? "active" : "error");
    setNote(result.message);
  };

  return (
    <section className="module-view">
      <h2>Data Exchange</h2>
      <p>
        Riders withdraw free T1 satellites from the Macana pool. T1 output is
        mostly standing, with only light MTC exchange on selected packets.
      </p>

      <div className="module-grid">
        <article className="module-card">
          <p className="module-label">Withdrawal Control</p>
          <h3>Corp Pool Distribution</h3>
          <div className="kv-grid">
            <p>Corp Pool</p>
            <p>{corpPoolCount}</p>
            <p>Rider Ready</p>
            <p>{riderReadySatelliteCount}</p>
            <p>Expired</p>
            <p>{riderExpiredSatelliteCount}</p>
            <p>Daily Withdrawals</p>
            <p>
              {withdrawalsUsed} / {withdrawalLimit}
            </p>
          </div>
          <div className="crafting-actions">
            <button onClick={() => runAction(onWithdrawSatellite())}>
              Withdraw Free T1
            </button>
          </div>
        </article>

        <article className="module-card">
          <p className="module-label">Field Deployment</p>
          <h3>Scan Target Routing</h3>
          <div className="kv-grid">
            <p>Standing</p>
            <p>{standing}</p>
            <p>Standing Tier</p>
            <p>{standingTierLabel}</p>
            <p>Active Deployment</p>
            <p>{activeDeployment ? activeDeployment.targetLabel : "NONE"}</p>
          </div>

          {activeDeployment ? (
            <p className="craft-note active">
              {activeDeployment.targetLabel} in {activeDeployment.systemLabel}.
              Resolution in {activeDeployment.remainingSeconds}s. Standing +
              {activeDeployment.standingReward}
              {activeDeployment.mtcReward > 0
                ? ` / MTC +${activeDeployment.mtcReward}`
                : " / no guaranteed MTC"}
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
                  <span>Standing +{target.standingReward}</span>
                  <span>
                    {target.mtcReward > 0
                      ? `MTC +${target.mtcReward}`
                      : "MTC rare"}
                  </span>
                </div>
                <button
                  onClick={() => runAction(onDeploySatellite(target.id))}
                  disabled={!!activeDeployment || riderReadySatelliteCount < 1}
                >
                  Deploy T1
                </button>
              </div>
            ))}
          </div>
        </article>

        <article className="module-card">
          <p className="module-label">Exchange Channel</p>
          <h3>Packet Submission</h3>
          <div className="kv-grid">
            <p>Standing</p>
            <p>{standing}</p>
            <p>MTC Wallet</p>
            <p>{mtcBalance}</p>
            <p>Pending Packets</p>
            <p>{pendingResults.length}</p>
          </div>

          <div className="result-list">
            {pendingResults.length > 0 ? (
              pendingResults.map((result) => (
                <div key={result.id} className="result-row">
                  <div>
                    <p>{result.targetLabel}</p>
                    <span>
                      Completed {formatCompletedAt(result.completedAt)} /
                      Standing +{result.standingAwarded}
                      {result.mtcAwarded > 0
                        ? ` / MTC +${result.mtcAwarded}`
                        : " / MTC 0"}
                    </span>
                  </div>
                  <button
                    onClick={() => runAction(onSubmitScanResult(result.id))}
                  >
                    Submit Packet
                  </button>
                </div>
              ))
            ) : (
              <p className="queue-empty">
                No captured scan packets waiting for exchange.
              </p>
            )}
          </div>

          <p className={`craft-note ${status}`}>{note}</p>
        </article>
      </div>
    </section>
  );
}
