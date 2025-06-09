// /components/waveform/testAnalysis.ts

export const testAnalysis = {
  original: {
    label: "original",
    url: "/files/01. Main Title (from “Game of Thrones”).mp3",
  },
  stems: [
    { label: "vocals", url: "/files/stems/01. Main Title (from “Game of Thrones”)/vocals.wav" },
    { label: "drums", url: "/files/stems/01. Main Title (from “Game of Thrones”)/drums.wav" },
    { label: "bass", url: "/files/stems/01. Main Title (from “Game of Thrones”)/bass.wav" },
    { label: "piano", url: "/files/stems/01. Main Title (from “Game of Thrones”)/piano.wav" },
    { label: "other", url: "/files/stems/01. Main Title (from “Game of Thrones”)/other.wav" },
  ],
  hits: [0.15, 0.30, 0.75, 1.5, 2.2, 2.8], // or the real array
  duration: 105.22,
};
