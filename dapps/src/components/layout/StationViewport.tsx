import { useEffect, useRef, useState, type ReactNode } from "react";

const STATION_STAGE_WIDTH = 1240;
const STATION_STAGE_HEIGHT = 820;
const MAX_STAGE_SCALE = 1.6;

type StationViewportProps = {
  children: ReactNode;
};

export function StationViewport({ children }: StationViewportProps) {
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const [layout, setLayout] = useState({
    scale: 1,
    width: STATION_STAGE_WIDTH,
    height: STATION_STAGE_HEIGHT,
  });

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) {
      return;
    }

    const updateLayout = () => {
      const bounds = viewport.getBoundingClientRect();
      const nextScale = Math.min(
        bounds.width / STATION_STAGE_WIDTH,
        bounds.height / STATION_STAGE_HEIGHT,
        MAX_STAGE_SCALE,
      );
      const safeScale =
        Number.isFinite(nextScale) && nextScale > 0 ? nextScale : 1;

      // The stage keeps one fixed composition and scales as a single unit so
      // the in-game browser can show the whole station without manual zooming.
      // Large desktop displays are allowed to upscale past 1 so the shell does
      // not look undersized on 1440p-class screens.
      setLayout({
        scale: safeScale,
        width: STATION_STAGE_WIDTH * safeScale,
        height: STATION_STAGE_HEIGHT * safeScale,
      });
    };

    updateLayout();

    const resizeObserver = new ResizeObserver(() => {
      updateLayout();
    });
    resizeObserver.observe(viewport);

    window.addEventListener("resize", updateLayout);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", updateLayout);
    };
  }, []);

  return (
    <div ref={viewportRef} className="station-stage-viewport">
      <div
        className="station-stage-sizer"
        style={{ width: `${layout.width}px`, height: `${layout.height}px` }}
      >
        <div
          className="station-stage"
          style={{
            width: `${STATION_STAGE_WIDTH}px`,
            height: `${STATION_STAGE_HEIGHT}px`,
            transform: `scale(${layout.scale})`,
          }}
        >
          <div className="station-stage-frame" aria-hidden="true" />
          {children}
        </div>
      </div>
    </div>
  );
}
