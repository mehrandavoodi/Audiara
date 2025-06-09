import { useEffect, useRef } from "react";
import WaveSurfer from "wavesurfer.js";
import { playBtnStyle, iconBtnStyle } from "./styles";

interface Props {
  label: string;
  url: string;
  duration: number;
  currentTime: number;
  isPlaying: boolean;
  soloed: boolean;
  muted: boolean;
  onPlay: () => void;
  onPause: () => void;
  onSeek: (time: number) => void;
  onSolo: () => void;
  onMute: () => void;
  soloDisabled: boolean;
  muteDisabled: boolean;
}

export default function StemWaveform({
  label,
  url,
  duration,
  currentTime,
  isPlaying,
  soloed,
  muted,
  onPlay,
  onPause,
  onSeek,
  onSolo,
  onMute,
  soloDisabled,
  muteDisabled,
}: Props) {
  const wsRef = useRef<WaveSurfer | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Init/destroy WaveSurfer on url change
  useEffect(() => {
    if (!containerRef.current) return;

    if (wsRef.current) wsRef.current.destroy();
    const ws = WaveSurfer.create({
      container: containerRef.current,
      waveColor: "#B2A4FF",
      progressColor: "#7B2FF2",
      height: 44,
      barWidth: 2,
      cursorColor: "#FF6F00",
      backend: "MediaElement",
      url: `http://localhost:8000${url}`,
      interact: !soloDisabled && !muteDisabled,
    });

    // User seek event
    // @ts-ignore
    ws.on("seek", (progress: number) => {
      const t = Math.max(0, Math.min(duration, progress * duration));
      onSeek(t);
    });

    wsRef.current = ws;
    return () => {
      ws.destroy();
      wsRef.current = null;
    };
    // eslint-disable-next-line
  }, [url, soloDisabled, muteDisabled]);

  // Volume: ONLY handle mute/unmute here (never pause)
  useEffect(() => {
    if (wsRef.current) wsRef.current.setVolume(muted ? 0 : 1);
  }, [muted]);

  // Sync playhead and play/pause state
  useEffect(() => {
    if (!wsRef.current) return;

    // Sync playhead
    if (Math.abs(wsRef.current.getCurrentTime() - currentTime) > 0.1) {
      wsRef.current.setTime(currentTime);
    }

    // Sync play/pause
    if (isPlaying) {
      if (!wsRef.current.isPlaying()) wsRef.current.play();
    } else {
      wsRef.current.pause();
    }
  }, [isPlaying, currentTime]);

  return (
    <div
      style={{
        background: "#F6F7FB",
        borderRadius: 12,
        padding: "10px 18px 7px 18px",
        margin: "14px 0",
        boxShadow: "none",
        display: "flex",
        flexDirection: "column"
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ fontWeight: 600, fontSize: 15, color: "#6F4AB9" }}>{label}</div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button
            style={{
              ...playBtnStyle,
              opacity: soloDisabled && !isPlaying ? 0.4 : 1,
              pointerEvents: soloDisabled && !isPlaying ? "none" : "auto",
            }}
            onClick={isPlaying ? onPause : onPlay}
            tabIndex={-1}
            disabled={soloDisabled && !isPlaying}
          >
            {isPlaying ? "⏸" : "▶️"}
          </button>
          <button
            style={{
              ...iconBtnStyle,
              background: muted ? "#F48FB1" : "#eee",
              opacity: muteDisabled ? 0.4 : 1,
              pointerEvents: muteDisabled ? "none" : "auto"
            }}
            title="Mute"
            onClick={onMute}
            disabled={muteDisabled}
            tabIndex={-1}
          >
            🔇
          </button>
          <button
            style={{
              ...iconBtnStyle,
              background: soloed ? "#FFF176" : "#eee",
              opacity: soloDisabled ? 0.4 : 1,
              pointerEvents: soloDisabled ? "none" : "auto"
            }}
            title="Solo"
            onClick={onSolo}
            disabled={soloDisabled}
            tabIndex={-1}
          >
            🎤
          </button>
        </div>
      </div>
      <div ref={containerRef} style={{ background: "#EDE7F6", borderRadius: 9, marginTop: 8, minHeight: 44 }} />
    </div>
  );
}
