import { BuildPanel } from "./BuildPanel";
import { CraftingGrid } from "./CraftingGrid";
import type { CraftingItem } from "./types";

type CraftingViewProps = {
  items: CraftingItem[];
  busyItemId: string | null;
  buildPanel: {
    activeItemLabel: string | null;
    timeLabel: string;
    message: string;
    queueCount: number;
    state: "idle" | "active" | "error" | "completed";
  };
  onBuild: (item: CraftingItem) => void;
};

export function CraftingView({
  items,
  busyItemId,
  buildPanel,
  onBuild,
}: CraftingViewProps) {
  return (
    <section className="relative h-full min-h-[1000px] w-full overflow-hidden">
      <img
        src="/assets/others/industrial_crafting_bacground.png"
        alt=""
        className="absolute inset-0 h-full w-full object-fill"
      />

      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.08),transparent_32%),linear-gradient(180deg,rgba(5,12,20,0.02),rgba(5,12,20,0.44))]" />

      <div className="relative z-10 mx-auto flex h-full w-full max-w-6xl flex-col px-5 pb-6 pt-6 sm:px-7 sm:pb-8 sm:pt-7 lg:px-10 xl:px-12">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_auto] md:items-start">
          <div className="mt-15 ml-39 text-xs font-medium uppercase tracking-[0.24em] text-cyan-100/90 sm:text-sm">
            Industrial Crafting
          </div>

          <div className="w-full max-w-[220px] md:w-[220px] md:justify-self-end md:-translate-x-16">
            <BuildPanel {...buildPanel} />
          </div>
        </div>

        <div className="mt-6 w-full sm:mt-8 lg:mt-10">
          <CraftingGrid
            items={items}
            busyItemId={busyItemId}
            onBuild={onBuild}
          />
        </div>
      </div>
    </section>
  );
}
