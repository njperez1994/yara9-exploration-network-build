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
        T1 satellites come from Macana Corp inventory, transfer to the rider on
        withdrawal, and expire 24 hours after issuance if not deployed.
      </p>
      <div className="module-grid">
        <article className="module-card">
          <p className="module-label">Tier 1 Access</p>
          <h3>Withdrawal Standing Gate</h3>
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
            T1 withdrawal is always free. Progression is controlled by standing,
            not by direct MTC purchase.
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
                <span>{tier.dailyWithdrawalLimit} daily withdrawals</span>
              </div>
            ))}
          </div>
        </article>
      </div>
    </section>
  );
}
