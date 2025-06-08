import { useEffect, useRef, useState } from "react";
import WaveSurfer from "wavesurfer.js";
import RegionsPlugin from "wavesurfer.js/dist/plugins/regions.js";

interface Stem {
  label: string;
  url: string;
}

interface Props {
  analysis: {
    original: Stem;
    stems: Stem[];
    hits: number[];
    duration: number;
  };
}

type StemState = {
  muted: boolean;
  soloed: boolean;
};

export default function WaveformPanel({ analysis }: Props) {
  // Main track
  const mainWaveformRef = useRef<HTMLDivElement | null>(null);
  const [mainWs, setMainWs] = useState<WaveSurfer | null>(null);

  // Stems: refs for divs and WaveSurfer instances
  const stemsRefs = useRef<{ [label: string]: HTMLDivElement | null }>({});
  const stemsWs = useRef<{ [label: string]: WaveSurfer | null }>({});

  // Used to trigger re-render after refs mount
  const [, forceUpdate] = useState(0);

  // App-wide states
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeTrack, setActiveTrack] = useState<"main" | string>("main");

  // Mute/Solo state
  const [stemStates, setStemStates] = useState<{ [label: string]: StemState }>(() =>
    Object.fromEntries(analysis.stems.map((s) => [s.label, { muted: false, soloed: false }]))
  );
  const anySoloed = Object.values(stemStates).some((s) => s.soloed);

  // Helper: all stem waveform divs must exist before we create WaveSurfer
  const allRefsReady = analysis.stems.every(
    (stem) => !!stemsRefs.current[stem.label]
  );

  // Debug: see which refs are missing
  useEffect(() => {
    if (!allRefsReady) {
      // eslint-disable-next-line
      console.log(
        "Waiting for refs to be ready",
        analysis.stems.map((s) => [s.label, !!stemsRefs.current[s.label]])
      );
    }
  }, [allRefsReady, analysis.stems]);

  // ----- Main WaveSurfer Setup -----
  useEffect(() => {
    if (!mainWaveformRef.current) return;
    if (mainWs) mainWs.destroy();

    const regionsPlugin = RegionsPlugin.create();
    const ws = WaveSurfer.create({
      container: mainWaveformRef.current,
      waveColor: "#7B2FF2",
      progressColor: "#A084E8",
      height: 64,
      barWidth: 2,
      cursorColor: "#FF6F00",
      backend: "MediaElement",
      url: `http://localhost:8000${analysis.original.url}`,
      plugins: [regionsPlugin]
    });

    ws.on("ready", () => {
      analysis.hits.forEach(hit => {
        regionsPlugin.addRegion({
          start: hit,
          end: hit + 0.04,
          color: "rgba(255,111,0,0.28)"
        });
      });
      ws.seekTo(currentTime / analysis.duration);
    });

    ws.on("play", () => {
      setActiveTrack("main");
      setIsPlaying(true);
    });
    ws.on("pause", () => setIsPlaying(false));
    ws.on("audioprocess", (time) => setCurrentTime(time));
    ws.on("interaction", (progress: number) => {
      if (typeof progress === "number") {
        const time = progress * analysis.duration;
        setCurrentTime(time);
        syncAllWaveforms(time, "main");
      }
    });

    setMainWs(ws);

    return () => { ws.destroy(); };
    // eslint-disable-next-line
  }, [analysis.original.url, analysis.hits]);

  // ----- Stems WaveSurfer Setup -----
  useEffect(() => {
    // Destroy *all* previous stems
    Object.values(stemsWs.current).forEach(ws => {
      if (ws) {
        try { ws.destroy(); } catch {}
      }
    });
    stemsWs.current = {};

    // Only initialize when all refs exist
    if (!allRefsReady) return;

    analysis.stems.forEach(stem => {
      const div = stemsRefs.current[stem.label];
      if (!div) return;

      // Destroy any previous WaveSurfer for this stem
      if (stemsWs.current[stem.label]) {
        try { stemsWs.current[stem.label]?.destroy(); } catch {}
        stemsWs.current[stem.label] = null;
      }

      const ws = WaveSurfer.create({
        container: div,
        waveColor: "#B2A4FF",
        progressColor: "#7B2FF2",
        height: 44,
        barWidth: 2,
        cursorColor: "#FF6F00",
        backend: "MediaElement",
        url: `http://localhost:8000${stem.url}`,
      });

      ws.on("ready", () => {
        ws.seekTo(currentTime / analysis.duration);
      });
      ws.on("play", () => {
        setActiveTrack(stem.label);
        setIsPlaying(true);
      });
      ws.on("pause", () => setIsPlaying(false));
      ws.on("audioprocess", (time) => setCurrentTime(time));
      ws.on("interaction", (progress: number) => {
        if (typeof progress === "number") {
          const time = progress * analysis.duration;
          setCurrentTime(time);
          syncAllWaveforms(time, stem.label);
        }
      });

      stemsWs.current[stem.label] = ws;
    });

    // Cleanup on unmount or re-init
    return () => {
      Object.values(stemsWs.current).forEach(ws => {
        if (ws) {
          try { ws.destroy(); } catch {}
        }
      });
      stemsWs.current = {};
    };
    // eslint-disable-next-line
  }, [allRefsReady, analysis.stems, currentTime]);

  // ----- Sync all waveforms' currentTime and playing state -----
  function syncAllWaveforms(time: number, who: string) {
    // Sync main
    if (mainWs && (who !== "main")) {
      mainWs.pause();
      mainWs.setTime(time);
    }
    // Sync stems
    Object.entries(stemsWs.current).forEach(([label, ws]) => {
      if (ws && who !== label) {
        ws.pause();
        ws.setTime(time);
      }
    });
  }

  // When currentTime changes (from outside), sync all waveforms
  useEffect(() => {
    if (mainWs) mainWs.setTime(currentTime);
    Object.values(stemsWs.current).forEach(ws => ws?.setTime(currentTime));
    // eslint-disable-next-line
  }, [currentTime]);

  // Play/Pause controls (only one track plays at a time)
  function handlePlayPause(track: "main" | string) {
    setActiveTrack(track);
    setIsPlaying((playing) => {
      // Pause all
      if (mainWs) mainWs.pause();
      Object.values(stemsWs.current).forEach(ws => ws?.pause());

      // If not already playing, play the chosen one
      if (!playing) {
        if (track === "main" && mainWs) {
          mainWs.setTime(currentTime);
          mainWs.play();
        } else if (track !== "main" && stemsWs.current[track]) {
          stemsWs.current[track]?.setTime(currentTime);
          stemsWs.current[track]?.play();
        }
        return true;
      }
      return false;
    });
  }

  // Mute/Solo logic for stems
  function toggleMute(label: string) {
    setStemStates((s) => ({ ...s, [label]: { ...s[label], muted: !s[label].muted } }));
  }
  function toggleSolo(label: string) {
    setStemStates((s) => ({ ...s, [label]: { ...s[label], soloed: !s[label].soloed } }));
  }

  // Volume logic: Mute non-soloed/muted stems
  useEffect(() => {
    Object.entries(stemsWs.current).forEach(([label, ws]) => {
      const state = stemStates[label];
      if (!state || !ws) return;
      if (anySoloed) {
        ws.setVolume(state.soloed ? 1 : 0);
      } else {
        ws.setVolume(state.muted ? 0 : 1);
      }
    });
    // Optionally mute mainWs when any stem is soloed
    if (mainWs) mainWs.setVolume(anySoloed ? 0 : 1);
  }, [stemStates, anySoloed, mainWs]);

  // Set waveform div refs for stems — robust
  function setDivRef(label: string, el: HTMLDivElement | null) {
    if (stemsRefs.current[label] !== el) {
      stemsRefs.current[label] = el;
      // Only force update once *all* refs have been set
      if (analysis.stems.every(stem => stemsRefs.current[stem.label])) {
        forceUpdate(x => x + 1);
      }
    }
  }

  // Render blank panel until all refs are ready
  if (!allRefsReady) {
    return (
      <div style={{ padding: 40, color: "#7B2FF2", textAlign: "center" }}>
        Loading stem waveforms...
      </div>
    );
  }

  return (
    <div style={panelCardStyle}>
      <h2 style={panelTitleStyle}>Audiara — Stems & Waveform</h2>
      <div style={dividerStyle} />

      {/* Main waveform */}
      <div style={{ width: "100%", margin: "20px 0 16px 0" }}>
        <div ref={mainWaveformRef} style={{ background: "#F6F7FB", borderRadius: 14 }} />
        <div style={{
          display: "flex", alignItems: "center", gap: 18, marginTop: 8, justifyContent: "space-between"
        }}>
          <div style={{ color: "#7B2FF2", fontWeight: 700, fontSize: 15 }}>Full Track</div>
          <div>
            <button style={playBtnStyle} onClick={() => handlePlayPause("main")}>
              {isPlaying && activeTrack === "main" ? "⏸" : "▶️"}
            </button>
          </div>
          <div style={{ color: "#555", fontSize: 14 }}>
            {formatTime(currentTime)} / {formatTime(analysis.duration)}
          </div>
        </div>
      </div>

      <div style={dividerStyle} />

      {/* Stems */}
      <div style={{ marginTop: 8, width: "100%" }}>
        {analysis.stems.map((stem) => (
          <div key={stem.label} style={{
            background: "#F6F7FB",
            borderRadius: 12,
            padding: "10px 18px 7px 18px",
            margin: "14px 0",
            boxShadow: "none",
            display: "flex",
            flexDirection: "column"
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ fontWeight: 600, fontSize: 15, color: "#6F4AB9" }}>{stem.label}</div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <button style={playBtnStyle}
                  onClick={() => handlePlayPause(stem.label)}>
                  {isPlaying && activeTrack === stem.label ? "⏸" : "▶️"}
                </button>
                <button style={{
                  ...iconBtnStyle,
                  background: stemStates[stem.label]?.muted ? "#F48FB1" : "#eee"
                }} title="Mute"
                  onClick={() => toggleMute(stem.label)}>
                  🔇
                </button>
                <button style={{
                  ...iconBtnStyle,
                  background: stemStates[stem.label]?.soloed ? "#FFF176" : "#eee"
                }} title="Solo"
                  onClick={() => toggleSolo(stem.label)}>
                  🎤
                </button>
              </div>
            </div>
            {/* Stem waveform */}
            <div
              ref={el => setDivRef(stem.label, el)}
              style={{ background: "#EDE7F6", borderRadius: 9, marginTop: 8, minHeight: 44 }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

function formatTime(secs: number) {
  const min = Math.floor(secs / 60);
  const sec = Math.floor(secs % 60);
  return `${min}:${sec.toString().padStart(2, "0")}`;
}

const panelCardStyle: React.CSSProperties = {
  minWidth: 420,
  maxWidth: 620,
  margin: "40px auto",
  padding: "34px 22px 22px 22px",
  background: "#fff",
  borderRadius: 28,
  boxShadow: "0 8px 32px 0 rgba(123,47,242,0.08)",
  display: "flex",
  flexDirection: "column",
  alignItems: "stretch"
};
const panelTitleStyle: React.CSSProperties = {
  color: "#7B2FF2",
  fontSize: 23,
  fontWeight: 700,
  margin: "0 0 8px 0",
  letterSpacing: 1.2
};
const dividerStyle: React.CSSProperties = {
  width: "100%",
  height: 1,
  background: "#e2d1fa",
  margin: "14px 0"
};
const playBtnStyle: React.CSSProperties = {
  background: "linear-gradient(90deg,#7B2FF2 60%,#A084E8 100%)",
  border: "none",
  borderRadius: 10,
  color: "#fff",
  fontWeight: 700,
  fontSize: 18,
  padding: "7px 18px",
  cursor: "pointer",
  margin: "0 4px",
  boxShadow: "0 2px 6px #ede7f6aa",
  outline: "none"
};
const iconBtnStyle: React.CSSProperties = {
  border: "none",
  borderRadius: 10,
  fontSize: 18,
  padding: "7px 10px",
  cursor: "pointer",
  margin: "0 2px",
  background: "#eee",
  outline: "none"
};
