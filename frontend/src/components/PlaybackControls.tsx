export default function PlaybackControls() {
  // This is just a visual demo, hook up your real audio player later!
  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      gap: 14,
      justifyContent: "center"
    }}>
      <button style={btnStyle}>⏮</button>
      <button style={btnStyle}>⏸</button>
      <button style={btnStyle}>⏭</button>
      <span style={{
        marginLeft: 14,
        color: "#7B2FF2",
        fontWeight: 700,
        fontSize: 16
      }}>
        00:00 / 03:00
      </span>
    </div>
  );
}

const btnStyle: React.CSSProperties = {
  background: "#ede7f6",
  border: "none",
  borderRadius: 10,
  color: "#7B2FF2",
  fontWeight: 700,
  fontSize: 22,
  padding: "6px 18px",
  cursor: "pointer",
  transition: "background 0.12s"
};
