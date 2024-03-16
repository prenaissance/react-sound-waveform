import { useState } from "react";
import styles from "./App.module.css";
import {
  AudioWaveVisualizer,
  BarFrequencyVisualizer,
  CircleFrequencyVisualizer,
  CircleWaveVisualizer,
  FFTSize,
} from "react-sound-waveform";

enum Visualizers {
  AudioWaveVisualizer = "Audio Waveform",
  BarFrequencyVisualizer = "Bar Frequencies",
  CircleFrequencyVisualizer = "Circle Frequencies",
  CircleWaveformVisualizer = "Circle Waveform",
}

function App() {
  const [objectURL, setObjectURL] = useState<string | undefined>(undefined);
  const [fftFrequencyBase, setFftFrequencyBase] = useState(8);
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);
  const [visualizer, setVisualizer] = useState<Visualizers>(
    Visualizers.AudioWaveVisualizer
  );
  const [minFrequency, setMinFrequency] = useState(20);
  const [maxFrequency, setMaxFrequency] = useState(6000);
  const [colorStrategy, setColorStrategy] = useState<"clamp" | "gradient">(
    "gradient"
  );
  const isFrequencyVisualizer =
    visualizer === Visualizers.BarFrequencyVisualizer ||
    visualizer === Visualizers.CircleFrequencyVisualizer;

  const commonVisualizerProps = {
    audio,
    height: 400,
    width: 600,
    className: styles.visualizer,
    fftSize: (2 ** fftFrequencyBase) as FFTSize,
  };

  return (
    <>
      <h1>Sound visualizer demo</h1>
      <div className={styles.flexItemsCenter}>
        <p className={styles.songSelectText}>Select song: </p>
        <input
          type="file"
          accept="audio/*"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) {
              setObjectURL(URL.createObjectURL(file));
            }
          }}
        />
      </div>
      <audio className={styles.audio} ref={setAudio} controls src={objectURL} />
      <fieldset className={styles.grid}>
        <legend>Visualizer</legend>
        <div>
          {Object.values(Visualizers).map((v) => (
            <label key={v} className={styles.block}>
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
        </div>
        <div>
          {isFrequencyVisualizer && (
            <>
              <div>
                Colors:{" "}
                {(["clamp", "gradient"] as const).map((strategy) => (
                  <label key={strategy}>
                    <input
                      type="radio"
                      name="colorStrategy"
                      value={strategy}
                      checked={colorStrategy === strategy}
                      onChange={() => setColorStrategy(strategy)}
                    />
                    {strategy}
                  </label>
                ))}
              </div>
              <label className={styles.block}>
                <input
                  type="range"
                  min={0}
                  max={20000}
                  value={minFrequency}
                  onChange={(e) =>
                    setMinFrequency(
                      Math.min(Number(e.target.value), maxFrequency)
                    )
                  }
                />
                Min frequency - {minFrequency}
              </label>
              <label className={styles.block}>
                <input
                  type="range"
                  min={0}
                  max={20000}
                  value={maxFrequency}
                  onChange={(e) =>
                    setMaxFrequency(
                      Math.max(Number(e.target.value), minFrequency)
                    )
                  }
                />
                Max frequency - {maxFrequency}
              </label>
            </>
          )}
          <label>
            <input
              type="range"
              min="5"
              max="15"
              value={fftFrequencyBase}
              onChange={(e) => setFftFrequencyBase(Number(e.target.value))}
            />
            FFT samples {2 ** fftFrequencyBase}
          </label>
        </div>
      </fieldset>
      {visualizer === Visualizers.AudioWaveVisualizer && (
        <AudioWaveVisualizer {...commonVisualizerProps} />
      )}
      {visualizer === Visualizers.BarFrequencyVisualizer && (
        <BarFrequencyVisualizer
          {...commonVisualizerProps}
          coloringStrategy={colorStrategy}
          minFrequency={minFrequency}
          maxFrequency={maxFrequency}
        />
      )}
      {visualizer === Visualizers.CircleFrequencyVisualizer && (
        <CircleFrequencyVisualizer
          {...commonVisualizerProps}
          coloringStrategy={colorStrategy}
          minFrequency={minFrequency}
          maxFrequency={maxFrequency}
        />
      )}
      {visualizer === Visualizers.CircleWaveformVisualizer && (
        <CircleWaveVisualizer {...commonVisualizerProps} />
      )}
    </>
  );
}

export default App;
