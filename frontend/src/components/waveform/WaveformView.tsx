import { useEffect, useRef } from "react";
import WaveSurfer from "wavesurfer.js";

interface WaveformViewProps {
  url: string;
  waveColor?: string;
  progressColor?: string;
  height?: number;
  currentTime: number;
  isPlaying: boolean;
  onSeek?: (time: number) => void;
  onPlay?: () => void;
  onPause?: () => void;
  children?: React.ReactNode; // For overlays if needed
}

export default function WaveformView({
  url,
  waveColor = "#B2A4FF",
  progressColor = "#7B2FF2",
  height = 44,
  currentTime,
  isPlaying,
  onSeek,
  onPlay,
  onPause,
  children,
}: WaveformViewProps) {
  const wsRef = useRef<WaveSurfer | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // (Re-)create WaveSurfer instance when url/container changes
  useEffect(() => {
    if (!containerRef.current) return;
    if (wsRef.current) wsRef.current.destroy();

    wsRef.current = WaveSurfer.create({
      container: containerRef.current,
      waveColor,
      progressColor,
      height,
      barWidth: 2,
      cursorColor: "#FF6F00",
      backend: "MediaElement",
      url,
    });

    // Only emit seek events on user interaction
    // @ts-expect-error
    wsRef.current.on("seek", (progress: number) => {
      const duration = wsRef.current?.getDuration() || 1;
      if (onSeek) onSeek(progress * duration);
    });
    wsRef.current.on("play", () => onPlay && onPlay());
    wsRef.current.on("pause", () => onPause && onPause());

    return () => wsRef.current?.destroy();
    // eslint-disable-next-line
  }, [url, waveColor, progressColor, height]);

  // Sync playback and time to parent
  useEffect(() => {
    const ws: any = wsRef.current;
    if (!ws) return;
    // Clamp to [0, duration]
    const duration = ws.getDuration() || 1;
    const t = Math.min(Math.max(0, currentTime), duration - 0.01);
    ws.setTime(t);

    // Sync playback state
    if (isPlaying && ws.isPaused()) {
      ws.play();
    } else if (!isPlaying && !ws.isPaused()) {
      ws.pause();
    }
    // eslint-disable-next-line
  }, [currentTime, isPlaying]);

  return (
    <div style={{ position: "relative", minHeight: height }}>
      <div ref={containerRef} />
      {children}
    </div>
  );
}
