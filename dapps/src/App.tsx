import { useMemo, useState } from "react";
import hangarBackground from "../../images/background.png";
import leftDoorPanel from "../../images/leftdoor.png";
import rightDoorPanel from "../../images/rigthdoor.png";

const SYSTEM_MESSAGES = [
  "Docking request uplink established...",
  "Scanning station capacity...",
  "Assigning docking platform...",
  "Platform BX-04 reserved...",
  "Verifying identity signature...",
  "Security handshake in progress...",
  "Clearance granted...",
  "Opening station gate...",
];

type DockingState =
  | "idle"
  | "authenticating"
  | "messaging"
  | "opening"
  | "opened";

const AUTH_DELAY_MS = 1400;
const MESSAGE_DELAY_MS = 900;
const GATE_OPEN_DELAY_MS = 1700;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function App() {
  const [dockingState, setDockingState] = useState<DockingState>("idle");
  const [currentMessageIndex, setCurrentMessageIndex] = useState(-1);

  const activeMessage = useMemo(() => {
    if (
      currentMessageIndex < 0 ||
      currentMessageIndex >= SYSTEM_MESSAGES.length
    ) {
      return "";
    }

    return SYSTEM_MESSAGES[currentMessageIndex];
  }, [currentMessageIndex]);

  const runDockingSequence = async () => {
    if (dockingState !== "idle") return;

    setDockingState("authenticating");
    setCurrentMessageIndex(-1);

    await sleep(AUTH_DELAY_MS);

    setDockingState("messaging");
    for (let step = 0; step < SYSTEM_MESSAGES.length; step += 1) {
      setCurrentMessageIndex(step);
      await sleep(MESSAGE_DELAY_MS);
    }

    setDockingState("opening");
    await sleep(GATE_OPEN_DELAY_MS);
    setDockingState("opened");
  };

  const doorsOpening = dockingState === "opening" || dockingState === "opened";
  const showMessages =
    dockingState === "messaging" || dockingState === "opening";

  return (
    <main className="dock-root">
      <img
        className="hangar-background"
        src={hangarBackground}
        alt="Macana orbital hangar"
      />

      <img
        className={`dock-door dock-door-left ${doorsOpening ? "open" : ""}`}
        src={leftDoorPanel}
        alt="Left station door"
      />
      <img
        className={`dock-door dock-door-right ${doorsOpening ? "open" : ""}`}
        src={rightDoorPanel}
        alt="Right station door"
      />

      <div className="station-frame" aria-hidden="true" />

      <div className="dock-hud">
        <p className="dock-tag">MACANA COMMERCE CENTER // DOCK BX-04</p>

        {dockingState === "idle" ? (
          <button className="dock-connect-button" onClick={runDockingSequence}>
            Connect Wallet
          </button>
        ) : null}

        {dockingState === "authenticating" ? (
          <p className="dock-status">Authenticating rider credentials...</p>
        ) : null}

        {showMessages ? <p className="dock-status">{activeMessage}</p> : null}

        {dockingState === "opened" ? (
          <p className="dock-status complete">
            Docking complete. Station access granted.
          </p>
        ) : null}
      </div>
    </main>
  );
}

export default App;
