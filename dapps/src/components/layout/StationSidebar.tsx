export type StationTab =
  | "market"
  | "industrial"
  | "riders"
  | "storage"
  | "licenses"
  | "exchange";

const MENU_ITEMS: Array<{ id: StationTab; label: string }> = [
  { id: "exchange", label: "Data Exchange" },
  { id: "industrial", label: "Fabrication" },
  { id: "licenses", label: "Licenses" },
  { id: "storage", label: "Storage Live" },
  { id: "riders", label: "Riders" },
  { id: "market", label: "Market" },
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
          type="button"
          className={`station-tab ${activeTab === item.id ? "active" : ""}`}
          onClick={() => onChangeTab(item.id)}
        >
          <span className="station-tab-label">{item.label}</span>
        </button>
      ))}
    </nav>
  );
}
