import { type HTMLAttributes, useState, useEffect } from "react";
import { FFTSize } from "../utils";
import { useAudioAnalyzer } from "../hooks/useAudioAnalyzer";

type Props = {
  audio?: HTMLAudioElement | null;
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

const drawSlice = (
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  radius: number,
  offsetRadians: number,
  sliceRadians: number
) => {
  ctx.beginPath();
  ctx.moveTo(centerX, centerY);
  ctx.arc(
    centerX,
    centerY,
    radius,
    offsetRadians,
    offsetRadians + sliceRadians
  );
  ctx.lineTo(centerX, centerY);
  ctx.closePath();
  ctx.fill();
};

const pixelsToRadians = (pixels: number, radius: number) =>
  ((pixels / 2) * Math.PI) / radius;

const CircleFrequencyVisualizer = ({
  audio,
  fftSize = 256,
  gap = 0,
  minFrequency = 20,
  maxFrequency = 2000,
  bgColor = "transparent",
  coloringStrategy = "clamp",
  colors = ["#ffffff", "#669966", "#558855", "#008888"],
  smoothingTimeConstant = 0.8,
  ...props
}: Props) => {
  const { audioContext, analyser } = useAudioAnalyzer({
    audio,
    fftSize,
    smoothingTimeConstant,
  });
  const [ctx, setCtx] = useState<CanvasRenderingContext2D | null | undefined>(
    null
  );

  useEffect(() => {
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    const nyquistFrequency = bufferLength;
    const minIndex = Math.floor(
      (minFrequency / nyquistFrequency) * bufferLength
    );
    const maxIndex = Math.floor(
      (Math.min(maxFrequency, nyquistFrequency) / nyquistFrequency) *
        bufferLength
    );
    const viewLength = maxIndex - minIndex;
    let frame: number;
    const draw = () => {
      if (!audio || !ctx) {
        frame = requestAnimationFrame(draw);
        return;
      }
      const radius = Math.min(ctx.canvas.width, ctx.canvas.height) / 2;
      const centerX = ctx.canvas.width / 2;
      const centerY = ctx.canvas.height / 2;
      const baseRadius = radius / 3;
      const view = dataArray.subarray(minIndex, maxIndex);
      ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

      analyser.getByteFrequencyData(dataArray);
      const cappedGap = Math.min(
        Math.max(0, gap),
        ctx.canvas.width / viewLength / 4
      );
      const cappedGapRadians = pixelsToRadians(cappedGap, radius);
      const sliceRadians = (2 * Math.PI) / viewLength - cappedGapRadians;
      if (coloringStrategy === "gradient") {
        const gradient = ctx.createRadialGradient(
          centerX,
          centerY,
          baseRadius,
          centerX,
          centerY,
          radius
        );
        colors.forEach((color, i) => {
          gradient.addColorStop((colors.length - i) / colors.length, color);
        });
        ctx.fillStyle = gradient;

        for (let i = 0; i < viewLength; i++) {
          const v = view[i] / 256;
          drawSlice(
            ctx,
            centerX,
            centerY,
            baseRadius + (v * radius * 2) / 3,
            i * (sliceRadians + cappedGapRadians),
            sliceRadians
          );
        }
      }
      if (coloringStrategy === "clamp") {
        for (let i = 0; i < viewLength; i++) {
          const value = 256 - view[i];
          const tier = 9 - Math.ceil(Math.log2(value));
          const colorIndex = colors.length - Math.min(tier, colors.length);
          const v = view[i] / 256;
          ctx.fillStyle = colors[colorIndex];
          drawSlice(
            ctx,
            centerX,
            centerY,
            baseRadius + (v * radius * 2) / 3,
            i * (sliceRadians + cappedGapRadians),
            sliceRadians
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

export default CircleFrequencyVisualizer;
