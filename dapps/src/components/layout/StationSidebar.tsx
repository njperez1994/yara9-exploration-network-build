export type StationTab =
  | "market"
  | "industrial"
  | "wallet"
  | "storage"
  | "licenses"
  | "exchange";

const MENU_ITEMS: Array<{ id: StationTab; label: string; code: string }> = [
  { id: "exchange", label: "Data Exchange", code: "DX" },
  { id: "industrial", label: "Fabrication", code: "FB" },
  { id: "licenses", label: "Licenses", code: "LC" },
  { id: "storage", label: "Storage Live", code: "ST" },
  { id: "wallet", label: "Wallet", code: "WL" },
  { id: "market", label: "Market", code: "MK" },
];

type StationSidebarProps = {
  activeTab: StationTab;
  onChangeTab: (tab: StationTab) => void;
};

export function StationSidebar({
  activeTab,
  onChangeTab,
}: StationSidebarProps) {
  return (
    <nav className="station-tabbar" aria-label="Station module navigation">
      {MENU_ITEMS.map((item) => (
        <button
          key={item.id}
          className={`station-tab ${activeTab === item.id ? "active" : ""}`}
          onClick={() => onChangeTab(item.id)}
        >
          <span className="station-tab-code">{item.code}</span>
          <span className="station-tab-label">{item.label}</span>
        </button>
      ))}
    </nav>
  );
}
