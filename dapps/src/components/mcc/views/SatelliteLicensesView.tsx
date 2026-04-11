type SatelliteLicensesViewProps = {
  standing: number;
  standingTierLabel: string;
  withdrawalLimit: number;
  withdrawalsUsed: number;
  standingTiers: Array<{
    id: string;
    label: string;
    minimumStanding: number;
    dailyWithdrawalLimit: number;
    isCurrent: boolean;
  }>;
};

export function SatelliteLicensesView({
  standing,
  standingTierLabel,
  withdrawalLimit,
  withdrawalsUsed,
  standingTiers,
}: SatelliteLicensesViewProps) {
  return (
    <section className="module-view">
      <h2>Satellite Licenses</h2>
      <p>
        Macana uses standing-based T1 probe quotas. Higher standing expands the
        daily public claim window for scan access.
      </p>
      <div className="module-grid">
        <article className="module-card">
          <p className="module-label">Tier 1 Access</p>
          <h3>Probe Claim Gate</h3>
          <div className="kv-grid">
            <p>Current Standing</p>
            <p>{standing}</p>
            <p>Standing Tier</p>
            <p>{standingTierLabel}</p>
            <p>Daily Cap</p>
            <p>
              {withdrawalsUsed} / {withdrawalLimit}
            </p>
          </div>
          <p className="license-rule">
            T1 claims are always free. Progression is controlled by standing,
            not by direct MTC purchase or frontend-side balance checks.
          </p>
        </article>
        <article className="module-card">
          <p className="module-label">Standing Tiers</p>
          <h3>Quota Windows</h3>
          <div className="license-tier-list">
            {standingTiers.map((tier) => (
              <div
                key={tier.id}
                className={`license-tier-row ${tier.isCurrent ? "current" : ""}`}
              >
                <p>{tier.label}</p>
                <span>Standing {tier.minimumStanding}+</span>
                <span>{tier.dailyWithdrawalLimit} daily T1 claims</span>
              </div>
            ))}
          </div>
        </article>
      </div>
    </section>
  );
}
