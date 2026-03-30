export function WalletView() {
  return (
    <section className="module-view">
      <h2>Wallet</h2>
      <p>Inspect station-linked balances and transaction readiness.</p>
      <div className="module-grid">
        <article className="module-card">
          <p className="module-label">Connected Account</p>
          <h3>Rider Wallet Linked</h3>
          <p>Wallet session active for mission transactions.</p>
        </article>
        <article className="module-card">
          <p className="module-label">Security Layer</p>
          <h3>Vault Authentication</h3>
          <p>Multi-step rider handshake verified by station control.</p>
        </article>
      </div>
    </section>
  );
}
