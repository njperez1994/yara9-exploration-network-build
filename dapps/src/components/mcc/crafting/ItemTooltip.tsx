import { createPortal } from "react-dom";
import type { CraftingItem } from "./types";

type TooltipPosition = {
  x: number;
  y: number;
};

type ItemTooltipProps = {
  item: CraftingItem | null;
  position: TooltipPosition;
  visible: boolean;
};

export function ItemTooltip({ item, position, visible }: ItemTooltipProps) {
  if (!item || !visible) return null;

  const tooltipWidth = 420;
  const tooltipHeight = 154;
  const offsetX = 18;
  const offsetY = 18;
  const viewportPadding = 12;

  const left = Math.min(
    Math.max(viewportPadding, position.x + offsetX),
    window.innerWidth - tooltipWidth - viewportPadding,
  );
  const top = Math.min(
    Math.max(viewportPadding, position.y + offsetY),
    window.innerHeight - tooltipHeight - viewportPadding,
  );

  return createPortal(
    
    <div
      className="pointer-events-none fixed z-[9999] w-[420px] border-3 border-black/70 bg-transparent p-[6px] text-white shadow-[0_14px_40px_rgba(0,0,0,0.55)]"
      style={{ left, top }}
    >
      {/* Bloque de Ttitulo del item*/}
      <div className="mb-[2px] rounded-[8px] border border-black/60 bg-[#171c23] px-1 py-[1px] text-center">
        <span className="text-[13px] font-semibold uppercase tracking-[0.18em] text-slate-100">
          {item.name}
        </span>
      </div>

      {/* Bloque de Imagen del item*/}
      <div className="grid grid-cols-[110px_1fr] gap-[2px] rounded-[10px] bg-transparent">
      <div className="flex h-full items-center justify-center rounded-[10px] border border-black/70 bg-[#12161c] p-[2px]">
        <img
          src={item.image}
          alt={item.name}
          className="block h-full w-full object-contain"
        />
      </div>

      <div className="rounded-[10px] border border-black/70 bg-[#12161c] px-[10px] py-[8px]">
        <p className="text-[12px] leading-[1.45] text-slate-200">
          {item.description}
        </p>
      </div>
    </div>
    </div>,
    document.body,
  );
}
