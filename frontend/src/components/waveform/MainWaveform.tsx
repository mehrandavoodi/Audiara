import { useEffect, useRef } from "react";
import WaveSurfer from "wavesurfer.js";
import RegionsPlugin from "wavesurfer.js/dist/plugins/regions.js";
import { playBtnStyle } from "./styles";

interface Props {
  url: string;
  hits: number[];
  duration: number;
  currentTime: number;
  isPlaying: boolean;
  onPlay: () => void;
  onPause: () => void;
  onSeek: (time: number) => void;
  disabled?: boolean;
}

export default function MainWaveform({
  url,
  hits,
  duration,
  currentTime,
  isPlaying,
  onPlay,
  onPause,
  onSeek,
  disabled = false,
}: Props) {
  const wsRef = useRef<WaveSurfer | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    if (wsRef.current) wsRef.current.destroy();
    const regionsPlugin = RegionsPlugin.create();
    const ws = WaveSurfer.create({
      container: containerRef.current,
      waveColor: "#7B2FF2",
      progressColor: "#A084E8",
      height: 64,
      barWidth: 2,
      cursorColor: "#FF6F00",
      backend: "MediaElement",
      url: `http://localhost:8000${url}`,
      plugins: [regionsPlugin],
      interact: !disabled,
    });

    ws.on("ready", () => {
      hits.forEach(hit =>
        regionsPlugin.addRegion({
          start: hit,
          end: hit + 0.04,
          color: "rgba(255,111,0,0.28)",
        })
      );
      ws.setTime(currentTime);
      ws.setVolume(disabled ? 0 : 1);
      if (isPlaying) ws.play();
    });

    // User seek
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
  }, [url, hits, disabled]);

  useEffect(() => {
    if (!wsRef.current) return;
    const ws = wsRef.current;
    ws.setVolume(disabled ? 0 : 1);

    // Sync playhead always
    if (Math.abs(ws.getCurrentTime() - currentTime) > 0.1) {
      ws.setTime(currentTime);
    }
    if (isPlaying && !disabled) {
      if (!ws.isPlaying()) ws.play();
    } else {
      ws.pause();
    }
  }, [isPlaying, disabled, currentTime]);

  return (
    <div style={{ width: "100%", margin: "20px 0 16px 0" }}>
      <div ref={containerRef} style={{ background: "#F6F7FB", borderRadius: 14 }} />
      <div style={{
        display: "flex", alignItems: "center", gap: 18, marginTop: 8, justifyContent: "space-between"
      }}>
        <div style={{ color: "#7B2FF2", fontWeight: 700, fontSize: 15 }}>Full Track</div>
        <div>
          <button
            style={{
              ...playBtnStyle,
              opacity: disabled ? 0.4 : 1,
              pointerEvents: disabled ? "none" : "auto",
            }}
            onClick={isPlaying ? onPause : onPlay}
            disabled={disabled}
            tabIndex={-1}
          >
            {isPlaying ? "⏸" : "▶️"}
          </button>
        </div>
        <div style={{ color: "#555", fontSize: 14 }}>
          {formatTime(currentTime)} / {formatTime(duration)}
        </div>
      </div>
    </div>
  );
}

function formatTime(secs: number) {
  const min = Math.floor(secs / 60);
  const sec = Math.floor(secs % 60);
  return `${min}:${sec.toString().padStart(2, "0")}`;
}
