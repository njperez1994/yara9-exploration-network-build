import { useState, type MouseEvent } from "react";
import { ItemTooltip } from "./ItemTooltip";
import { ResourceGrid } from "./ResourceGrid";
import type { CraftingItem } from "./types";

type CraftingCardProps = {
  item: CraftingItem;
  busy: boolean;
  onBuild: (item: CraftingItem) => void;
};

export function CraftingCard({ item, busy, onBuild }: CraftingCardProps) {
  const [tooltipVisible, setTooltipVisible] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const ownerLocked =
    item.blockedReason === "Owner access required to build T1";
  const buildDisabled = busy || !item.canBuild;
  const buildLabel = busy ? "Building" : ownerLocked ? "Owner Only" : "Build";
  const buildBlockedReason =
    !busy && !item.canBuild ? item.blockedReason : null;

  const handleTooltipMove = (event: MouseEvent<HTMLDivElement>) => {
    setTooltipPosition({ x: event.clientX, y: event.clientY });
  };

  return (
    <article className="group relative mx-auto w-full max-w-[260px] bg-transparent p-2 transition duration-300 hover:-translate-y-1 hover:drop-shadow-[0_0_18px_rgba(56,189,248,0.22)] sm:max-w-[280px] sm:p-3 lg:max-w-none lg:p-4">
      <div
        className="group/image relative"
        onMouseEnter={(event) => {
          setTooltipVisible(true);
          setTooltipPosition({ x: event.clientX, y: event.clientY });
        }}
        onMouseMove={handleTooltipMove}
        onMouseLeave={() => setTooltipVisible(false)}
      >
        <img
          src={item.image}
          alt={item.name}
          className="mx-auto h-44 w-full max-w-[180px] rounded-2xl object-cover transition duration-300 group-hover:brightness-110 sm:h-52 sm:max-w-[210px] lg:h-56 lg:max-w-[220px]"
        />

        <div className="absolute left-3 top-3 rounded-full bg-cyan-950/35 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-cyan-100/90 backdrop-blur-sm">
          {item.tierLabel}
        </div>

        <ItemTooltip
          item={item}
          position={tooltipPosition}
          visible={tooltipVisible}
        />
      </div>

      <div className="mx-auto mt-3 w-full max-w-[220px] sm:mt-4 sm:max-w-[240px]">
        <ResourceGrid resources={item.resources} />

        <div className="group/build relative mt-3">
          <button
            type="button"
            onClick={() => onBuild(item)}
            disabled={buildDisabled}
            className="w-full rounded-xl border border-cyan-300/35 bg-cyan-400/10 px-4 py-3 text-xs font-semibold uppercase tracking-[0.26em] text-cyan-50 backdrop-blur-sm transition duration-200 hover:border-cyan-200/70 hover:bg-cyan-300/16 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {buildLabel}
          </button>

          {/* The blocked-build reason lives in a hover tooltip so the station UI
              stays compact while still explaining why the CTA is unavailable. */}
          {buildBlockedReason ? (
            <div className="pointer-events-none absolute bottom-[calc(100%+8px)] left-1/2 z-30 hidden w-max max-w-[220px] -translate-x-1/2 rounded-lg border border-black/80 bg-[#12161c] px-3 py-2 text-center text-[10px] font-medium uppercase tracking-[0.12em] text-amber-100 shadow-[0_14px_30px_rgba(0,0,0,0.45)] group-hover/build:block">
              {buildBlockedReason}
            </div>
          ) : null}
        </div>
      </div>
    </article>
  );
}
