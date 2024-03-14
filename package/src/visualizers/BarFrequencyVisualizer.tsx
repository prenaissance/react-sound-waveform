import { type HTMLAttributes, useState, useEffect } from "react";
import { FFTSize } from "../utils";

type Props = {
  audio?: HTMLAudioElement;
  fftSize?: FFTSize;
  bgColor?: string;
  gap?: number;
  colors?: string[];
  /** The clamp strategy  */
  coloringStrategy?: "clamp" | "gradient";
  minFrequency?: number;
  maxFrequency?: number;
  width?: number;
  height?: number;
  smoothingTimeConstant?: number;
} & HTMLAttributes<HTMLCanvasElement>;

const BarFrequencyVisualizer = ({
  audio,
  fftSize = 2048,
  gap = 1,
  minFrequency = 0,
  maxFrequency = 2000,
  bgColor = "transparent",
  coloringStrategy = "clamp",
  colors = ["#ffffff", "#669966", "#558855", "#008888"],
  smoothingTimeConstant = 0.8,
  ...props
}: Props) => {
  const [audioContext] = useState(() => new AudioContext());
  const [analyser] = useState(() => audioContext.createAnalyser());
  const [ctx, setCtx] = useState<CanvasRenderingContext2D | null | undefined>(
    null
  );

  useEffect(() => {
    audioContext.resume();
    return () => void audioContext.suspend();
  }, [audioContext]);

  useEffect(() => {
    if (!audio) return;

    const source = audioContext.createMediaElementSource(audio);
    source.connect(analyser);
    analyser.connect(audioContext.destination);
    analyser.fftSize = fftSize;
    analyser.smoothingTimeConstant = smoothingTimeConstant;
    return () => {
      source.disconnect();
      analyser.disconnect();
    };
  }, [audio, audioContext, analyser, fftSize, smoothingTimeConstant]);

  useEffect(() => {
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    const nyquistFrequency = audioContext.sampleRate / 2;
    const minIndex = Math.floor(
      (minFrequency / nyquistFrequency) * bufferLength
    );
    const maxIndex = Math.floor(
      (maxFrequency / nyquistFrequency) * bufferLength
    );
    const viewLength = maxIndex - minIndex;
    let frame: number;
    const draw = () => {
      if (!audio || !ctx) {
        frame = requestAnimationFrame(draw);
        return;
      }
      const view = dataArray.subarray(minIndex, maxIndex);
      ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

      analyser.getByteFrequencyData(dataArray);
      const sliceWidth = ctx.canvas.width / viewLength;
      const cappedGap = Math.min(
        Math.max(0, gap),
        ctx.canvas.width / viewLength / 4
      );
      if (coloringStrategy === "gradient") {
        const gradient = ctx.createLinearGradient(0, 0, 0, ctx.canvas.height);
        colors.forEach((color, i) => {
          gradient.addColorStop(i / colors.length, color);
        });
        ctx.fillStyle = gradient;

        for (let i = 0; i < viewLength; i++) {
          const v = view[i] / 256;
          const y = v * ctx.canvas.height;
          ctx.fillRect(
            i * (sliceWidth + cappedGap),
            ctx.canvas.height - y,
            sliceWidth - cappedGap,
            y
          );
        }
      }
      if (coloringStrategy === "clamp") {
        for (let i = 0; i < viewLength; i++) {
          const value = 256 - view[i];
          const tier = 9 - Math.ceil(Math.log2(value));
          const colorIndex = colors.length - Math.min(tier, colors.length);
          const v = view[i] / 256;
          const y = v * ctx.canvas.height;
          ctx.fillStyle = colors[colorIndex];
          ctx.fillRect(
            i * (sliceWidth + cappedGap),
            ctx.canvas.height - y,
            sliceWidth - cappedGap,
            y
          );
        }
      }
      frame = requestAnimationFrame(draw);
    };
    draw();
    return () => (frame ? cancelAnimationFrame(frame) : undefined);
  }, [
    analyser,
    audio,
    audioContext,
    ctx,
    fftSize,
    bgColor,
    colors,
    coloringStrategy,
    gap,
    minFrequency,
    maxFrequency,
  ]);

  return (
    <canvas {...props} ref={(canvas) => setCtx(canvas?.getContext("2d"))} />
  );
};

export default BarFrequencyVisualizer;
