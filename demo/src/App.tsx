import { useRef, useState } from "react";
import reactLogo from "./assets/react.svg";
import viteLogo from "/vite.svg";
import "./App.css";
import {
  AudioWaveVisualizer,
  BarFrequencyVisualizer,
  FFTSize,
} from "react-sound-waveform";

enum Visualizers {
  AudioWaveVisualizer = "Audio Waveform",
  BarFrequencyVisualizer = "Bar Frequencies",
}

function App() {
  const [objectURL, setObjectURL] = useState<string | undefined>(undefined);
  const [fftFrequencyBase, setFftFrequencyBase] = useState<number>(5);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [visualizer, setVisualizer] = useState<Visualizers>(
    Visualizers.AudioWaveVisualizer
  );

  const commonVisualizerProps = {
    audio: audioRef.current!,
    height: 400,
    width: 600,
    style: { display: "block", height: "400px", width: "600px" },
    fftSize: (2 ** fftFrequencyBase) as FFTSize,
  };

  return (
    <>
      <div>
        <a href="https://vitejs.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1>Vite + React</h1>
      <fieldset>
        <legend>Visualizer</legend>
        {Object.values(Visualizers).map((v) => (
          <label key={v}>
            <input
              type="radio"
              name="visualizer"
              value={v}
              checked={visualizer === v}
              onChange={() => setVisualizer(v)}
            />
            {v}
          </label>
        ))}
      </fieldset>
      <label>
        FFT Frequency {2 ** fftFrequencyBase}
        <input
          type="range"
          min="5"
          max="15"
          value={fftFrequencyBase}
          onChange={(e) => setFftFrequencyBase(Number(e.target.value))}
        />
      </label>

      <input
        type="file"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) {
            setObjectURL(URL.createObjectURL(file));
          }
        }}
      />
      <audio ref={audioRef} controls src={objectURL} />
      {visualizer === Visualizers.AudioWaveVisualizer && (
        <AudioWaveVisualizer {...commonVisualizerProps} />
      )}
      {visualizer === Visualizers.BarFrequencyVisualizer && (
        <BarFrequencyVisualizer {...commonVisualizerProps} />
      )}
    </>
  );
}

export default App;
