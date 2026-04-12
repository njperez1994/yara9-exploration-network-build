import { useEffect, useMemo, useRef, useState } from "react";
import hangarBackground from "../../images/background.png";
import leftDoorPanel from "../../images/leftdoor.png";
import rightDoorPanel from "../../images/rigthdoor.png";
import { useConnection } from "@evefrontier/dapp-kit";
import { StationShell } from "./components/layout/StationShell";
import { StationViewport } from "./components/layout/StationViewport";
import { resolveStationIdentity } from "./gameplay/stationIdentity";

const AUTH_SEQUENCE_SOUND = "/assets/sounds/autenticating_rider.wav";
const OPEN_DOOR_SOUND = "/assets/sounds/opendoor.wav";
const EVE_VAULT_EXTENSION_URL =
  "https://github.com/evefrontier/evevault/releases";
const STATION_ACCESS_SESSION_KEY = "macana.station.access.open";

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
  const { currentAccount, handleConnect, hasEveVault, isConnected } =
    useConnection();
  const stationIdentity = useMemo(
    () => resolveStationIdentity(currentAccount?.address ?? null),
    [currentAccount?.address],
  );
  const [dockingState, setDockingState] = useState<DockingState>("idle");
  const [currentMessageIndex, setCurrentMessageIndex] = useState(-1);
  const [showAccessNotice, setShowAccessNotice] = useState(false);
  const [pendingDockAfterConnect, setPendingDockAfterConnect] = useState(false);
  const [connectHint, setConnectHint] = useState<string | null>(null);
  const [shouldRestoreStationAccess] = useState(() => {
    if (typeof window === "undefined") {
      return false;
    }

    return sessionStorage.getItem(STATION_ACCESS_SESSION_KEY) === "opened";
  });
  const authAudioRef = useRef<HTMLAudioElement | null>(null);
  const doorAudioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const authAudio = new Audio(AUTH_SEQUENCE_SOUND);
    authAudio.loop = true;
    authAudio.volume = 0.45;
    authAudioRef.current = authAudio;

    const doorAudio = new Audio(OPEN_DOOR_SOUND);
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

  useEffect(() => {
    if (!pendingDockAfterConnect || !isConnected || dockingState !== "idle") {
      return;
    }

    setPendingDockAfterConnect(false);
    setConnectHint(null);
    void runDockingSequence();
  }, [dockingState, isConnected, pendingDockAfterConnect]);

  useEffect(() => {
    if (
      !shouldRestoreStationAccess ||
      !isConnected ||
      dockingState !== "idle"
    ) {
      return;
    }

    // Refreshing the page inside the same tab should keep the rider inside the
    // station shell instead of replaying the docking ritual on every reload.
    setConnectHint(null);
    setDockingState("opened");
  }, [dockingState, isConnected, shouldRestoreStationAccess]);

  useEffect(() => {
    if (dockingState !== "opened" || typeof window === "undefined") {
      return;
    }

    sessionStorage.setItem(STATION_ACCESS_SESSION_KEY, "opened");
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

  const connectButtonLabel = useMemo(() => {
    if (isConnected) {
      return "Enter Station";
    }

    return hasEveVault ? "Connect Wallet" : "Install EVE Vault";
  }, [hasEveVault, isConnected]);

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

  const handleStationAccess = () => {
    if (dockingState !== "idle") {
      return;
    }

    if (isConnected) {
      setConnectHint(null);
      void runDockingSequence();
      return;
    }

    // CCP's wallet kit discovers both the browser EVE Vault extension and the
    // in-game EVE Frontier Client Wallet through the same connection hook.
    if (hasEveVault) {
      setConnectHint("Awaiting secure wallet approval...");
      setPendingDockAfterConnect(true);
      handleConnect();
      return;
    }

    setPendingDockAfterConnect(false);
    setConnectHint(
      "External browser access requires the EVE Vault extension. Install it, sign in, then reload Macana.",
    );

    // The official docs require the browser extension for external dApp access.
    // The standalone Eve Vault web app is not enough to inject a wallet into this page.
    window.open(EVE_VAULT_EXTENSION_URL, "_blank", "noopener,noreferrer");
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

      {dockingState !== "opened" ? (
        <div className="station-frame" aria-hidden="true" />
      ) : null}

      <div className="dock-hud">
        <p className="dock-tag">MACANA COMMERCE CENTER // DOCK BX-04</p>

        {dockingState === "idle" ? (
          <button className="dock-connect-button" onClick={handleStationAccess}>
            {connectButtonLabel}
          </button>
        ) : null}

        {dockingState === "idle" && connectHint ? (
          <p className="dock-status">{connectHint}</p>
        ) : null}

        {dockingState === "authenticating" ? (
          <p className="dock-status">Authenticating rider credentials...</p>
        ) : null}

        {showMessages ? <p className="dock-status">{activeMessage}</p> : null}
      </div>

      {dockingState === "opened" ? (
        <StationViewport>
          <StationShell identity={stationIdentity} />

          {showAccessNotice ? (
            <div className="station-access-notice">
              Docking complete. Station access granted.
            </div>
          ) : null}
        </StationViewport>
      ) : null}
    </main>
  );
}

export default App;
