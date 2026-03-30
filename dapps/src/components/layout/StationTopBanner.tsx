import macanaLogo from "../../../../images/macana_corporation_logo2.png";

type ResourcePanel = {
  lux: string;
  mtc: string;
  scanData: string;
};

type StationTopBannerProps = {
  resources: ResourcePanel;
};

export function StationTopBanner({ resources }: StationTopBannerProps) {
  return (
    <header className="station-top-banner">
      <div className="station-logo-wrap">
        <img src={macanaLogo} alt="Macana Corp logo" className="station-logo" />
        <div>
          <p className="station-title">Macana Commerce Center</p>
          <p className="station-subtitle">YARA-9 Exploration Network</p>
        </div>
      </div>

      <div className="resource-strip">
        <div className="resource-tile">
          <span>LUX</span>
          <strong>{resources.lux}</strong>
        </div>
        <div className="resource-tile">
          <span>MTC</span>
          <strong>{resources.mtc}</strong>
        </div>
        <div className="resource-tile">
          <span>Scan Data</span>
          <strong>{resources.scanData}</strong>
        </div>
      </div>
    </header>
  );
}
