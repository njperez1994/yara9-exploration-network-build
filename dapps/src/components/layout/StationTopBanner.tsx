import macanaLogo from "../../../../images/macana_corporation_logo2.png";

type ResourcePanel = {
  lux: string;
  mtc: string;
  scanData: string;
};

type StationTopBannerProps = {
  resources: ResourcePanel;
  riderName: string;
  riderRole: string;
  activeModuleLabel: string;
  opsStatus: string;
};

export function StationTopBanner({
  resources,
  riderName,
  riderRole,
  activeModuleLabel,
  opsStatus,
}: StationTopBannerProps) {
  return (
    <header className="station-top-banner">
      <div className="station-banner-primary">
        <div className="station-logo-wrap">
          <img
            src={macanaLogo}
            alt="Macana Corp logo"
            className="station-logo"
          />
          <div>
            <p className="station-title">Macana Commerce Center</p>
            <p className="station-subtitle">YARA-9 Exploration Network</p>
          </div>
        </div>

        <div className="station-status-rack" aria-label="Station status strip">
          <div className="station-status-cell">
            <span>Ops State</span>
            <strong>{opsStatus}</strong>
          </div>
          <div className="station-status-cell">
            <span>Module</span>
            <strong>{activeModuleLabel}</strong>
          </div>
          <div className="station-status-cell">
            <span>Rider</span>
            <strong>
              {riderName} / {riderRole.toUpperCase()}
            </strong>
          </div>
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
