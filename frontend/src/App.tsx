import React from "react";
import WaveformPanel from "./components/waveform/WaveformPanel";
import { testAnalysis } from "./components/waveform/testAnalysis";

function App() {
  return (
    <div style={{ background: "#F6F7FB", minHeight: "100vh", paddingTop: 50 }}>
      <WaveformPanel analysis={testAnalysis} />
    </div>
  );
}

export default App;





// import { useEffect, useState } from "react";
// import SplashScreen from "./components/SplashScreen";
// import AudioDropzone from "./components/AudioDropzone";
// import LoadingPanel from "./components/LoadingPanel";
// import WaveformPanel from "./components/waveform/WaveformPanel";

// export type AppPhase = "splash" | "dropzone" | "loading" | "waveform";

// function App() {
//   const [phase, setPhase] = useState<AppPhase>("splash");
//   const [audioFile, setAudioFile] = useState<File | null>(null);
//   const [analysisResult, setAnalysisResult] = useState<any>(null);

//   // Splash screen for 1.5 seconds
//   useEffect(() => {
//     if (phase === "splash") {
//       const t = setTimeout(() => setPhase("dropzone"), 1500);
//       return () => clearTimeout(t);
//     }
//   }, [phase]);

//   // Handler when file is selected
//   const handleAudioFileSelected = (file: File) => {
//     setAudioFile(file);
//     setPhase("loading");
//     // You could POST to backend here, or trigger in LoadingPanel
//   };

//   // Handler when analysis is complete
//   const handleAnalysisDone = (result: any) => {
//     setAnalysisResult(result);
//     setPhase("waveform");
//   };

//   return (
//     <div style={{
//       minHeight: "100vh",
//       minWidth: "100vw",
//       display: "flex",
//       alignItems: "center",
//       justifyContent: "center",
//       background: "#F6F7FB",
//       fontFamily: "Inter, Helvetica Neue, Arial, sans-serif"
//     }}>
//       {phase === "splash" && <SplashScreen />}
//       {phase === "dropzone" &&
//         <AudioDropzone onAudioFileSelected={handleAudioFileSelected} />}
//       {phase === "loading" && audioFile &&
//         <LoadingPanel
//           file={audioFile}
//           onAnalysisDone={handleAnalysisDone}
//         />}
//       {phase === "waveform" && analysisResult &&
//         <WaveformPanel analysis={analysisResult} />}
//     </div>
//   );
// }

// export default App;
