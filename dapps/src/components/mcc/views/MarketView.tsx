export function MarketView() {
  return (
    <section className="module-view">
      <h2>Market</h2>
      <p>Review station commodity feeds and current YARA-9 material prices.</p>
      <div className="module-grid">
        <article className="module-card">
          <p className="module-label">Featured Commodity</p>
          <h3>YARA-9 Fragment Lot</h3>
          <p>High volatility. Updated 3m ago.</p>
        </article>
        <article className="module-card">
          <p className="module-label">Market Pulse</p>
          <h3>Demand Rising</h3>
          <p>Industrial sectors request additional signal fragments.</p>
        </article>
      </div>
    </section>
  );
}
