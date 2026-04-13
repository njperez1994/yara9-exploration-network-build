import { createPortal } from "react-dom";

type TooltipPosition = {
  x: number;
  y: number;
};

type ResourceTooltipProps = {
  name: string;
  amount: number;
  available: boolean;
  position: TooltipPosition;
  visible: boolean;
};

export function ResourceTooltip({
  name,
  amount,
  available,
  position,
  visible,
}: ResourceTooltipProps) {
  if (!visible) {
    return null;
  }

  const tooltipWidth = 210;
  const tooltipHeight = 30;
  const offsetX = 16;
  const offsetY = 16;
  const viewportPadding = 10;

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
      className="pointer-events-none fixed z-[9999] whitespace-nowrap border border-black opacity-80 backdrop-blur-sm px-2 py-1 text-[10px] font-medium uppercase tracking-[0.14em] text-white shadow-lg"
      style={{ left, top }}
    >
      <span>{name}:</span>{" "}
      <span style={{ color: available ? "#86efac" : "#fca5a5" }}>{amount}</span>
    </div>,
    document.body,
  );
}
