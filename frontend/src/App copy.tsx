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


