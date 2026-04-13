import { useState, type MouseEvent } from "react";
import { createPortal } from "react-dom";

type ResourcePanel = {
  mtc: string;
  scanData: string;
};

type TooltipState = {
  label: string;
  description: string;
} | null;

type StationTopBannerProps = {
  resources: ResourcePanel;
};

export function StationTopBanner({ resources }: StationTopBannerProps) {
  const [tooltip, setTooltip] = useState<TooltipState>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });

  const handleTooltipMove = (event: MouseEvent<HTMLDivElement>) => {
    setTooltipPosition({ x: event.clientX, y: event.clientY });
  };

  const resourceTiles = [
    {
      id: "mtc",
      label: "MTC Balance",
      description:
        "Current trade-credit balance available to the docked rider.",
      icon: "/assets/others/mtc_logo_silver.png",
      value: resources.mtc,
    },
    {
      id: "scan-data",
      label: "Scan Data",
      description:
        "Survey packets currently held by the station exchange flow.",
      icon: "/assets/others/scan_data_logo2.png",
      value: resources.scanData,
    },
  ] as const;

  const tooltipWidth = 250;
  const tooltipHeight = 62;
  const offsetX = 18;
  const offsetY = 18;
  const viewportPadding = 12;

  const left = Math.min(
    Math.max(viewportPadding, tooltipPosition.x + offsetX),
    window.innerWidth - tooltipWidth - viewportPadding,
  );
  const top = Math.min(
    Math.max(viewportPadding, tooltipPosition.y + offsetY),
    window.innerHeight - tooltipHeight - viewportPadding,
  );

  return (
    <>
      <header className="station-top-banner">
        <div className="resource-strip">
          {resourceTiles.map((tile) => (
            <div
              key={tile.id}
              className="resource-tile resource-tile--icon"
              onMouseEnter={(event) => {
                setTooltip({
                  label: tile.label,
                  description: tile.description,
                });
                setTooltipPosition({ x: event.clientX, y: event.clientY });
              }}
              onMouseMove={handleTooltipMove}
              onMouseLeave={() => setTooltip(null)}
            >
              <img src={tile.icon} alt="" aria-hidden="true" />
              <strong>{tile.value}</strong>
            </div>
          ))}
        </div>
      </header>

      {tooltip
        ? createPortal(
            <div
              className="pointer-events-none fixed z-[9999] w-[250px] border-[3px] border-black/75 bg-transparent p-[4px] text-white shadow-[0_14px_40px_rgba(0,0,0,0.55)]"
              style={{ left, top }}
            >
              <div className="rounded-[8px] border border-black/70 bg-[rgba(16,21,29,0.66)] px-[10px] py-[8px] backdrop-blur-md">
                <span className="block text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-100">
                  {tooltip.label}
                </span>
                <span className="mt-1 block text-[10px] leading-[1.4] tracking-[0.02em] text-slate-300">
                  {tooltip.description}
                </span>
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
