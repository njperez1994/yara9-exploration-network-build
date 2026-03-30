type DataExchangeViewProps = {
  moduleCount: number;
  pendingScan: boolean;
  dataItems: number;
  standing: number;
  mtcRewards: number;
  onStartScan: () => void;
  onCompleteScan: () => void;
  onRedeemData: () => void;
};

export function DataExchangeView({
  moduleCount,
  pendingScan,
  dataItems,
  standing,
  mtcRewards,
  onStartScan,
  onCompleteScan,
  onRedeemData,
}: DataExchangeViewProps) {
  return (
    <section className="module-view">
      <h2>Data Exchange</h2>
      <p>Run the MVP loop: consume module, scan, mint data, redeem rewards.</p>

      <div className="module-grid">
        <article className="module-card">
          <p className="module-label">Scan Operations</p>
          <h3>Tier 1 Scan Control</h3>
          <div className="kv-grid">
            <p>T1 Modules</p>
            <p>{moduleCount}</p>
            <p>Pending Scan</p>
            <p>{pendingScan ? "YES" : "NO"}</p>
            <p>Data Items</p>
            <p>{dataItems}</p>
          </div>
          <div className="crafting-actions">
            <button
              onClick={onStartScan}
              disabled={pendingScan || moduleCount < 1}
            >
              Start Scan
            </button>
            <button onClick={onCompleteScan} disabled={!pendingScan}>
              Complete Scan
            </button>
          </div>
        </article>

        <article className="module-card">
          <p className="module-label">Redemption Channel</p>
          <h3>MCC Rewards</h3>
          <div className="kv-grid">
            <p>Standing</p>
            <p>{standing}</p>
            <p>MTC Rewards</p>
            <p>{mtcRewards}</p>
          </div>
          <div className="crafting-actions">
            <button onClick={onRedeemData} disabled={dataItems < 1}>
              Redeem Data Item
            </button>
          </div>
        </article>
      </div>
    </section>
  );
}
