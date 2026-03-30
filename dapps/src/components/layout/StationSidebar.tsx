export type StationTab =
  | "market"
  | "industrial"
  | "wallet"
  | "storage"
  | "licenses"
  | "exchange";

const MENU_ITEMS: Array<{ id: StationTab; label: string }> = [
  { id: "market", label: "Market" },
  { id: "industrial", label: "Industrial Crafting" },
  { id: "wallet", label: "Wallet" },
  { id: "storage", label: "Storage Live" },
  { id: "licenses", label: "Satellite Licenses" },
  { id: "exchange", label: "Data Exchange" },
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
    <aside className="station-sidebar">
      <p className="sidebar-header">Station Modules</p>

      <nav className="sidebar-menu" aria-label="Station module navigation">
        {MENU_ITEMS.map((item) => (
          <button
            key={item.id}
            className={`sidebar-item ${activeTab === item.id ? "active" : ""}`}
            onClick={() => onChangeTab(item.id)}
          >
            {item.label}
          </button>
        ))}
      </nav>
    </aside>
  );
}
