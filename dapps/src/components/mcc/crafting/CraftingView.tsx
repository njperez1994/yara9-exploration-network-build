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
    <section className="relative h-full min-h-0 w-full overflow-x-hidden overflow-y-auto">
      <div className="relative min-h-full">
        <div
          className="pointer-events-none absolute inset-0 overflow-hidden"
          aria-hidden="true"
        >
          <div className="flex min-h-full flex-col">
            {/* The crafting background is split into top/middle/bottom layers so
                tall layouts can grow without stretching a single frame asset. */}
            <div className="relative h-[240px] flex-none sm:h-[300px] lg:h-[340px]">
              <img
                src="/assets/others/industrial_crafting_bacground_capa_alta.png"
                alt=""
                className="absolute inset-0 h-full w-full object-cover object-top"
              />
              <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-b from-transparent via-slate-950/70 to-slate-950/95" />
              <div className="absolute inset-x-10 bottom-0 h-10 bg-cyan-950/20 blur-2xl" />
            </div>

            <div
              className="relative min-h-[260px] flex-1"
              style={{
                backgroundImage:
                  'url("/assets/others/industrial_crafting_bacground_capa_media.png")',
                backgroundPosition: "top center",
                backgroundRepeat: "repeat-y",
                backgroundSize: "100% auto",
              }}
            >
              <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-slate-950/90 via-slate-950/40 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-b from-transparent via-slate-950/35 to-slate-950/85" />
            </div>

            <div className="relative h-[220px] flex-none sm:h-[260px] lg:h-[300px]">
              <img
                src="/assets/others/industrial_crafting_bacground_capa_baja.png"
                alt=""
                className="absolute inset-0 h-full w-full object-cover object-bottom"
              />
              <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-slate-950/95 via-slate-950/65 to-transparent" />
              <div className="absolute inset-x-10 top-0 h-10 bg-cyan-950/18 blur-2xl" />
            </div>
          </div>

          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.08),transparent_32%),linear-gradient(180deg,rgba(5,12,20,0.04),rgba(5,12,20,0.26)_38%,rgba(5,12,20,0.48))]" />
        </div>

        <div className="relative z-10 mx-auto flex min-h-full w-full max-w-6xl flex-col px-4 pb-6 pt-4 sm:px-6 sm:pb-8 sm:pt-5 lg:px-8">
          {/* Keep the operational header in its own block so the build panel and
              title read cleanly before the card grid starts below it. */}
          <div className="sm:px-5 sm:py-5">
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_auto] lg:items-start">
              <div className="pl-2 pt-1 sm:pl-4 lg:pl-10">
                <div className="ml-15 mt-1 text-xs font-medium uppercase tracking-[0.24em] text-cyan-100/90 sm:text-sm">
                  Industrial Crafting
                </div>
              </div>

              <div className="w-full max-w-[220px] lg:w-[220px] lg:justify-self-end">
                <BuildPanel {...buildPanel} />
              </div>
            </div>
          </div>

          <div className="mt-4 px-1 py-3 sm:mt-5 sm:px-2 sm:py-4">
            <CraftingGrid
              items={items}
              busyItemId={busyItemId}
              onBuild={onBuild}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
