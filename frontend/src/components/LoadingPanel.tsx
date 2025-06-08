import { useEffect, useState } from "react";

interface Props {
  file: File;
  onAnalysisDone: (result: any) => void;
}

export default function LoadingPanel({ file, onAnalysisDone }: Props) {
  const [progress, setProgress] = useState(0);
  const [msg, setMsg] = useState("Uploading and analyzing audio...");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isCancelled = false;

    async function uploadAndAnalyze() {
      setMsg("Uploading audio...");
      setProgress(10);
      const formData = new FormData();
      formData.append("file", file);

      try {
        const response = await fetch("http://localhost:8000/upload-audio/", {
          method: "POST",
          body: formData,
        });
        if (!response.ok) throw new Error("Upload failed");
        setMsg("Analyzing audio...");
        setProgress(70);

        // Simulate backend analysis delay, replace with actual fetch if needed!
        setTimeout(async () => {
          if (isCancelled) return;
          // Here, fetch your actual analysis result from the backend (mocked for now)
          const analysisResult = { stems: ["Vocals", "Bass", "Drums"], hits: [0.4, 1.1, 2.3] };
          setProgress(100);
          setMsg("Analysis complete!");
          setTimeout(() => onAnalysisDone(analysisResult), 600);
        }, 1200);

      } catch (err) {
        setError("❌ Error uploading or analyzing audio.");
        setProgress(0);
      }
    }

    uploadAndAnalyze();
    return () => { isCancelled = true; };
    // eslint-disable-next-line
  }, [file, onAnalysisDone]);

  return (
    <div style={{
      minWidth: 340,
      minHeight: 180,
      padding: "48px 36px",
      background: "#fff",
      borderRadius: 24,
      boxShadow: "0 8px 32px 0 rgba(123,47,242,0.07)",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      position: "relative"
    }}>
      <div style={{
        fontSize: 20,
        fontWeight: 700,
        color: "#7B2FF2",
        marginBottom: 16
      }}>
        {msg}
      </div>
      <div style={{
        width: "100%",
        height: 12,
        background: "#EDE7F6",
        borderRadius: 6,
        marginBottom: 16,
        overflow: "hidden"
      }}>
        <div style={{
          width: `${progress}%`,
          height: "100%",
          background: "linear-gradient(90deg,#7B2FF2 60%,#A084E8 100%)",
          transition: "width 0.5s cubic-bezier(.4,1,.3,1)"
        }} />
      </div>
      {error && <div style={{ color: "#D32F2F", fontWeight: 600 }}>{error}</div>}
      <div style={{ marginTop: 20, color: "#ccc", fontSize: 13 }}>
        Please wait, this may take a moment...
      </div>
    </div>
  );
}
