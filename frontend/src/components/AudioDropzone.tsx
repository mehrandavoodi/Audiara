import { useDropzone} from "react-dropzone";
import { useState, useCallback } from "react";
import type { FileRejection, DropEvent } from "react-dropzone";

const ACCEPTED_AUDIO_TYPES = [
    ".mp3",
    ".wav",
    ".flac",
    ".m4a",
    ".aac",
    ".ogg"
];

interface Props {
  onAudioFileSelected: (file: File) => void;
}

export default function AudioDropzone({ onAudioFileSelected }: Props) {
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback(
    (acceptedFiles: File[], fileRejections: FileRejection[], event: DropEvent) => {
      setError(null);
      if (acceptedFiles.length > 0) {
        onAudioFileSelected(acceptedFiles[0]);
      } else if (fileRejections && fileRejections.length > 0) {
        setError("Unsupported file type.");
      }
    },
    [onAudioFileSelected]
  );

  const {
    getRootProps,
    getInputProps,
    isDragActive,
    isDragAccept,
    isDragReject
  } = useDropzone({
    onDrop,
    accept: { "audio/*": ACCEPTED_AUDIO_TYPES },
    multiple: false,
    maxFiles: 1
  });

  return (
    <div
      {...getRootProps()}
      style={{
        border: `2px dashed ${isDragAccept ? "#7B2FF2" : isDragReject ? "#D32F2F" : "#BBB"}`,
        background: isDragActive ? "#EFEAFE" : "#fff",
        borderRadius: 24,
        padding: "48px 36px",
        minWidth: 340,
        color: "#444",
        cursor: "pointer",
        textAlign: "center",
        boxShadow: isDragActive ? "0 6px 24px #ede7f6" : "0 2px 12px #ede7f660",
        transition: "all 0.18s cubic-bezier(.2,.6,.6,1)"
      }}
    >
      <input {...getInputProps()} />
      <div style={{ fontWeight: 700, fontSize: 20, color: "#7B2FF2", marginBottom: 10 }}>
        Drag &amp; drop audio file
      </div>
      <div style={{ fontSize: 15, color: "#999", marginBottom: 16 }}>
        or <b>click</b> to select an MP3, WAV, FLAC, M4A, etc.
      </div>
      {error && <div style={{ color: "#D32F2F", fontWeight: 600 }}>{error}</div>}
      <div style={{ marginTop: 20, color: "#ccc", fontSize: 13 }}>
        Powered by DormantSky / Audiara
      </div>
    </div>
  );
}