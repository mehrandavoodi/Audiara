import { useEffect, useState } from "react";

interface Props {
  file: File;
  onAnalysisDone: (result: any) => void;
}

export default function LoadingPanel({ file, onAnalysisDone }: Props) {
  const [msg, setMsg] = useState("Uploading audio...");
  const [progress, setProgress] = useState(10);
  const [jobId, setJobId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isCancelled = false;
    let pollInterval: ReturnType<typeof setInterval>;

    // Step 1: Upload and get jobid
    async function upload() {
      setMsg("Uploading audio...");
      setProgress(20);
      const formData = new FormData();
      formData.append("file", file);
      try {
        const response = await fetch("http://localhost:8000/upload-audio/", {
          method: "POST",
          body: formData,
        });
        if (!response.ok) throw new Error("Upload failed");
        const { jobid } = await response.json();
        if (isCancelled) return;
        setJobId(jobid);
        setMsg("Queued for analysis...");
        setProgress(35);

        // Step 2: Poll for status
        pollInterval = setInterval(async () => {
          try {
            const res = await fetch(`http://localhost:8000/status/${jobid}`);
            if (!res.ok) throw new Error("Polling error");
            const stat = await res.json();
            if (isCancelled) return;

            switch (stat.status) {
              case "uploading":
                setMsg("Uploading audio...");
                setProgress(20);
                break;
              case "queued":
                setMsg("Queued for analysis...");
                setProgress(40);
                break;
              case "analyzing":
                setMsg("Analyzing audio (extracting stems & beats)...");
                setProgress(80);
                break;
              case "done":
                setMsg("Analysis complete!");
                setProgress(100);
                clearInterval(pollInterval);
                setTimeout(() => onAnalysisDone(stat.result), 800);
                break;
              case "error":
                setError(`Error: ${stat.error || "Unknown error"}`);
                setProgress(0);
                clearInterval(pollInterval);
                break;
              default:
                setMsg("Working...");
                setProgress(50);
                break;
            }
          } catch (err) {
            setError("Error polling backend.");
            clearInterval(pollInterval);
          }
        }, 1800);

      } catch (err: any) {
        setError("❌ Error uploading audio.");
        setProgress(0);
      }
    }
    upload();

    return () => {
      isCancelled = true;
      if (pollInterval) clearInterval(pollInterval);
    };
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
          transition: "width 0.6s cubic-bezier(.4,1,.3,1)"
        }} />
      </div>
      {error && <div style={{ color: "#D32F2F", fontWeight: 600 }}>{error}</div>}
      <div style={{ marginTop: 20, color: "#aaa", fontSize: 13 }}>
        This can take a minute or two for big files.
      </div>
    </div>
  );
}
