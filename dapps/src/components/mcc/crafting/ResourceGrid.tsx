import { useState, type MouseEvent } from "react";
import { ResourceTooltip } from "./ResourceTooltip";
import type { CraftingResource } from "./types";

type ResourceGridProps = {
  resources: CraftingResource[];
};

export function ResourceGrid({ resources }: ResourceGridProps) {
  const [hoveredResourceId, setHoveredResourceId] = useState<string | null>(
    null,
  );
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });

  const handleTooltipMove = (event: MouseEvent<HTMLDivElement>) => {
    setTooltipPosition({ x: event.clientX, y: event.clientY });
  };

  return (
    <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
      {resources.map((resource) => {
        const isRequired = resource.amount > 0;
        const isInactiveSlot = !isRequired;

        return (
          <div
            key={resource.id}
            className={`relative flex min-h-[60px] flex-col items-center justify-center rounded-xl bg-slate-950/40 px-1 py-1.5 sm:min-h-[68px] sm:py-2 ${
              isInactiveSlot ? "pointer-events-none opacity-35" : "opacity-100"
            }`}
            onMouseEnter={(event) => {
              if (!isRequired) {
                return;
              }

              setHoveredResourceId(resource.id);
              setTooltipPosition({ x: event.clientX, y: event.clientY });
            }}
            onMouseMove={isRequired ? handleTooltipMove : undefined}
            onMouseLeave={() => setHoveredResourceId(null)}
          >
            {/* Recipe slots with amount 0 stay visible for layout consistency,
                but they render as inactive because that material is not part of
                the current tier recipe. */}
            <img
              src={resource.icon}
              alt={resource.name}
              className="h-7 w-7 object-contain sm:h-8 sm:w-8"
            />
            <span className="mt-1 text-[10px] font-semibold sm:text-[11px]">
              {resource.amount}
            </span>
            {isRequired ? (
              <ResourceTooltip
                name={resource.name}
                amount={resource.amount}
                available={resource.available}
                position={tooltipPosition}
                visible={hoveredResourceId === resource.id}
              />
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
