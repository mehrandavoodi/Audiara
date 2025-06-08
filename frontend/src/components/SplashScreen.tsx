export default function SplashScreen() {
  return (
    <div style={{
      minWidth: 320,
      minHeight: 180,
      padding: "64px 40px",
      background: "#fff",
      borderRadius: 30,
      boxShadow: "0 8px 40px 0 rgba(123,47,242,0.10)",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      animation: "fadeIn 0.6s cubic-bezier(.2,.6,.6,1)"
    }}>
      <h1 style={{
        color: "#7B2FF2",
        fontSize: 38,
        letterSpacing: 1.2,
        fontWeight: 900,
        margin: 0
      }}>
        Notre Ville
      </h1>
      <div style={{
        color: "#B39DDB",
        marginTop: 8,
        fontSize: 19,
        letterSpacing: 0.4,
        fontWeight: 500
      }}>
        by Notre Ville Studio
      </div>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.96);}
          to { opacity: 1; transform: scale(1);}
        }
      `}</style>
    </div>
  );
}
