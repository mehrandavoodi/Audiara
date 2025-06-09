import { useRef, useState, useEffect } from "react";
import MainWaveform from "./MainWaveform";
import StemWaveform from "./StemWaveform";
import { panelCardStyle, panelTitleStyle, dividerStyle } from "./styles.ts";

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
type StemState = { muted: boolean; soloed: boolean; };

export default function WaveformPanel({ analysis }: Props) {
  // State
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [mode, setMode] = useState<"main" | "stems">("main");
  const [activeSolo, setActiveSolo] = useState<string | null>(null);
  const [stemStates, setStemStates] = useState<{ [label: string]: StemState }>(() =>
    Object.fromEntries(analysis.stems.map((s) => [s.label, { muted: false, soloed: false }]))
  );
  const timerRef = useRef<number | undefined>(undefined);

  // Helpers
  const allStemsMuted = analysis.stems.every(
    (s) => stemStates[s.label]?.muted || (activeSolo && activeSolo !== s.label)
  );
  const audibleStems =
    activeSolo !== null
      ? analysis.stems.filter((s) => s.label === activeSolo)
      : analysis.stems.filter((s) => !stemStates[s.label].muted);

  // ---- Timer loop: Always sync currentTime from whichever track is playing ----
  useEffect(() => {
    if (!isPlaying) {
      clearInterval(timerRef.current);
      return;
    }
    timerRef.current = window.setInterval(() => {
      // Find the "primary" audio element (main or first unmuted/soloed stem)
      let audio: HTMLAudioElement | null = null;
      if (mode === "main") {
        audio = document.querySelector<HTMLAudioElement>(".waveform-main audio");
      } else if (mode === "stems") {
        const label = activeSolo || audibleStems[0]?.label;
        if (label)
          audio = document.querySelector<HTMLAudioElement>(`.waveform-stem-${label} audio`);
      }
      if (audio && !isNaN(audio.currentTime)) {
        setCurrentTime(audio.currentTime);
      }
    }, 100);
    return () => clearInterval(timerRef.current);
    // eslint-disable-next-line
  }, [isPlaying, mode, activeSolo, audibleStems.length]);

  // --- Play/pause/seek handlers
  const handlePlayMain = () => {
    setMode("main");
    setIsPlaying(true);
  };
  const handlePlayStems = () => {
    setMode("stems");
    setIsPlaying(true);
  };
  const handlePause = () => setIsPlaying(false);
  const handleSeek = (time: number) => {
    setCurrentTime(time);
    // Set all audio elements' currentTime
    setTimeout(() => {
      // main
      const mainAudio = document.querySelector<HTMLAudioElement>(".waveform-main audio");
      if (mainAudio) mainAudio.currentTime = time;
      // stems
      analysis.stems.forEach((stem) => {
        const el = document.querySelector<HTMLAudioElement>(`.waveform-stem-${stem.label} audio`);
        if (el) el.currentTime = time;
      });
    }, 20);
  };

  // --- SOLO/MUTE logic (solo = mute all others)
  function toggleSolo(label: string) {
    setStemStates((prev) => {
      const isSoloing = !prev[label].soloed;
      const newStates = Object.fromEntries(
        Object.entries(prev).map(([k, v]) =>
          k === label
            ? [k, { muted: false, soloed: isSoloing }]
            : [k, { ...v, muted: isSoloing ? true : v.muted, soloed: false }]
        )
      );
      setActiveSolo(isSoloing ? label : null);
      setMode("stems");
      setIsPlaying(isSoloing || isPlaying);
      return newStates;
    });
  }
  function toggleMute(label: string) {
    if (activeSolo) return; // Can't mute in solo mode
    setStemStates((prev) => ({
      ...prev,
      [label]: { ...prev[label], muted: !prev[label].muted }
    }));
  }

  // --- Spacebar global play/pause
  useEffect(() => {
    const onSpace = (e: KeyboardEvent) => {
      if (e.code === "Space" || e.key === " ") {
        e.preventDefault();
        setIsPlaying((playing) => !playing);
      }
    };
    window.addEventListener("keydown", onSpace);
    return () => window.removeEventListener("keydown", onSpace);
  }, []);

  return (
    <div style={panelCardStyle}>
      <h2 style={panelTitleStyle}>Audiara — Stems & Waveform</h2>
      <div style={dividerStyle} />

      {/* Main waveform */}
      <div className="waveform-main">
        <MainWaveform
          url={analysis.original.url}
          hits={analysis.hits}
          duration={analysis.duration}
          currentTime={currentTime}
          isPlaying={mode === "main" && isPlaying}
          onPlay={handlePlayMain}
          onPause={handlePause}
          onSeek={handleSeek}
          disabled={mode === "stems"}
        />
      </div>
      <div style={dividerStyle} />

      {/* Stems section */}
      <div style={{ marginTop: 8, width: "100%" }}>
        {analysis.stems.map((stem) => (
          <div
            key={stem.label}
            className={`waveform-stem-${stem.label}`}
          >
            <StemWaveform
              label={stem.label}
              url={stem.url}
              duration={analysis.duration}
              currentTime={currentTime}
              isPlaying={
                mode === "stems" &&
                isPlaying &&
                ((activeSolo && stem.label === activeSolo) ||
                  (!activeSolo && !stemStates[stem.label].muted))
              }
              soloed={!!stemStates[stem.label].soloed}
              muted={
                !!stemStates[stem.label].muted ||
                (activeSolo !== null && stem.label !== activeSolo)
              }
              onPlay={handlePlayStems}
              onPause={handlePause}
              onSeek={handleSeek}
              onSolo={() => toggleSolo(stem.label)}
              onMute={() => toggleMute(stem.label)}
              soloDisabled={!!activeSolo && !stemStates[stem.label].soloed}
              muteDisabled={!!activeSolo}
            />
          </div>
        ))}
        {mode === "stems" && allStemsMuted && (
          <div
            style={{
              color: "#B00020",
              fontWeight: 600,
              fontSize: 15,
              margin: "20px 0",
              textAlign: "center"
            }}
          >
            All stems are muted.
          </div>
        )}
      </div>
    </div>
  );
}
