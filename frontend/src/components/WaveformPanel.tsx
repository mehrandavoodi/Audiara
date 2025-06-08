import PlaybackControls from "./PlaybackControls";

interface Props {
  analysis: {
    stems: string[];
    hits: number[];  // times in seconds
    // You can expand this as needed!
  };
}

export default function WaveformPanel({ analysis }: Props) {
  // For demo, fake duration and waveform shape
  const duration = 3.0; // seconds
  const width = 340;
  const height = 38;

  function renderWaveform(name: string) {
    // Generate a random SVG waveform shape
    const points = Array.from({ length: 32 }, (_, i) => {
      const x = (i / 31) * width;
      const y = height / 2 + Math.sin(i / 3 + name.length) * (height / 2.5) * Math.random();
      return `${x},${y}`;
    }).join(" ");
    return (
      <svg width={width} height={height} style={{ background: "#f6f7fb", borderRadius: 10 }}>
        <polyline
          fill="none"
          stroke="#7B2FF2"
          strokeWidth={2}
          points={points}
        />
      </svg>
    );
  }

  function renderHits() {
    return (
      <div style={{
        position: "absolute",
        left: 0,
        top: 0,
        width,
        height: 4,
        pointerEvents: "none"
      }}>
        {analysis.hits.map((hit, idx) => {
          const left = `${(hit / duration) * 100}%`;
          return (
            <div
              key={idx}
              style={{
                position: "absolute",
                left,
                top: 0,
                width: 3,
                height: 16,
                background: "#FF6F00",
                borderRadius: 2,
                transform: "translate(-50%, 0)",
                boxShadow: "0 1px 6px #ffefc2",
              }}
            />
          );
        })}
      </div>
    );
  }

  return (
    <div style={{
      minWidth: 380,
      padding: "36px 20px",
      background: "#fff",
      borderRadius: 24,
      boxShadow: "0 8px 32px 0 rgba(123,47,242,0.10)",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: 16,
      position: "relative"
    }}>
      <h2 style={{
        color: "#7B2FF2",
        fontSize: 23,
        fontWeight: 700,
        margin: "0 0 12px 0",
      }}>Waveforms & Stems</h2>
      <div style={{ marginBottom: 10, color: "#888", fontSize: 14 }}>
        Audio separated into stems. Hit moments (orange) shown above waveform.
      </div>

      {/* Main waveform with hits overlay */}
      <div style={{ position: "relative", marginBottom: 20 }}>
        {renderWaveform("Main")}
        {renderHits()}
        <div style={{ color: "#7B2FF2", fontSize: 13, marginTop: 2, textAlign: "center" }}>
          Main track
        </div>
      </div>

      {/* Stem waveforms */}
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {analysis.stems.map((stem, i) => (
          <div key={stem} style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            {renderWaveform(stem)}
            <div style={{ color: "#888", fontSize: 13, marginTop: 2 }}>{stem}</div>
          </div>
        ))}
      </div>

      {/* Playback Controls */}
      <div style={{ marginTop: 26, width: "100%" }}>
        <PlaybackControls />
      </div>

      {/* Export Buttons (placeholder) */}
      <div style={{ marginTop: 22, display: "flex", gap: 14, justifyContent: "center" }}>
        <button style={exportBtnStyle}>Export Stems</button>
        <button style={exportBtnStyle}>Export Hits</button>
      </div>
    </div>
  );
}

// Button style
const exportBtnStyle: React.CSSProperties = {
  background: "linear-gradient(90deg,#7B2FF2 60%,#A084E8 100%)",
  border: "none",
  borderRadius: 10,
  color: "#fff",
  fontWeight: 600,
  fontSize: 15,
  padding: "10px 24px",
  cursor: "pointer",
  transition: "background 0.15s",
  boxShadow: "0 2px 7px #ede7f6aa"
};
