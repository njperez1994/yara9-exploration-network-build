import { useEffect, useMemo, useRef, useState } from "react";
import hangarBackground from "../../images/background.png";
import leftDoorPanel from "../../images/leftdoor.png";
import rightDoorPanel from "../../images/rigthdoor.png";
import authSequenceSound from "../../assets/sounds/autenticating_rider.wav";
import openDoorSound from "../../assets/sounds/opendoor.wav";
import { StationShell } from "./components/layout/StationShell";

const SYSTEM_MESSAGES = [
  "Docking request uplink established...",
  "Assigning docking platform...",
  "Platform BX-04 reserved...",
  "Verifying identity signature...",
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
  const [showAccessNotice, setShowAccessNotice] = useState(false);
  const authAudioRef = useRef<HTMLAudioElement | null>(null);
  const doorAudioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const authAudio = new Audio(authSequenceSound);
    authAudio.loop = true;
    authAudio.volume = 0.45;
    authAudioRef.current = authAudio;

    const doorAudio = new Audio(openDoorSound);
    doorAudio.volume = 0.7;
    doorAudioRef.current = doorAudio;

    return () => {
      authAudio.pause();
      authAudio.currentTime = 0;
      doorAudio.pause();
      doorAudio.currentTime = 0;
    };
  }, []);

  useEffect(() => {
    if (dockingState !== "opened") return;

    setShowAccessNotice(true);
    const timeout = setTimeout(() => {
      setShowAccessNotice(false);
    }, 4000);

    return () => clearTimeout(timeout);
  }, [dockingState]);

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
    try {
      await authAudioRef.current?.play();
    } catch {
      // Ignore autoplay failures from restrictive browsers.
    }

    await sleep(AUTH_DELAY_MS);

    setDockingState("messaging");
    for (let step = 0; step < SYSTEM_MESSAGES.length; step += 1) {
      setCurrentMessageIndex(step);
      await sleep(MESSAGE_DELAY_MS);
    }

    setDockingState("opening");
    if (authAudioRef.current) {
      authAudioRef.current.pause();
      authAudioRef.current.currentTime = 0;
    }
    try {
      if (doorAudioRef.current) {
        doorAudioRef.current.currentTime = 0;
      }
      await doorAudioRef.current?.play();
    } catch {
      // Ignore autoplay failures from restrictive browsers.
    }

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
      </div>

      {dockingState === "opened" ? <StationShell /> : null}

      {dockingState === "opened" && showAccessNotice ? (
        <div className="station-access-notice">
          Docking complete. Station access granted.
        </div>
      ) : null}
    </main>
  );
}

export default App;
