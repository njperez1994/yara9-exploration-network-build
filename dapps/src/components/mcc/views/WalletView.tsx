type WalletViewProps = {
  connectedWalletAddress: string | null;
  riderWalletAddress: string;
  riderName: string;
  riderRole: "normal" | "owner";
};

function abbreviateAddress(value: string) {
  if (value.length <= 14) {
    return value;
  }

  return `${value.slice(0, 8)}...${value.slice(-6)}`;
}

export function WalletView({
  connectedWalletAddress,
  riderWalletAddress,
  riderName,
  riderRole,
}: WalletViewProps) {
  const usingDemoIdentity = !connectedWalletAddress;

  return (
    <section className="module-view">
      <h2>Wallet</h2>
      <p>Inspect station-linked balances and transaction readiness.</p>
      <div className="module-grid">
        <article className="module-card">
          <p className="module-label">Connected Account</p>
          <h3>{riderName}</h3>
          <p>
            {connectedWalletAddress
              ? `Live wallet linked: ${abbreviateAddress(connectedWalletAddress)}`
              : `Demo rider identity active: ${abbreviateAddress(riderWalletAddress)}`}
          </p>
        </article>
        <article className="module-card">
          <p className="module-label">Security Layer</p>
          <h3>{riderRole === "owner" ? "Owner Access" : "Rider Access"}</h3>
          <p>
            {usingDemoIdentity
              ? "The station is using a fallback rider identity until a live wallet is connected."
              : "Wallet session is active and the Supabase rider profile is synced to this address."}
          </p>
        </article>
      </div>
    </section>
  );
}
