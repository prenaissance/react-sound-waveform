import { type HTMLAttributes, useState, useEffect } from "react";
import { FFTSize } from "../utils";

type Props = {
  audio?: HTMLAudioElement;
  fftSize?: FFTSize;
  bgColor?: string;
  strokeColor?: string;
  strokeWidth?: number;
  filled?: boolean;
  width?: number;
  height?: number;
  smoothingTimeConstant?: number;
} & HTMLAttributes<HTMLCanvasElement>;

const CircleWaveVisualizer = ({
  audio,
  fftSize = 2048,
  bgColor = "transparent",
  strokeColor = "#669966",
  filled = false,
  strokeWidth = 5,
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
    let frame: number;
    const draw = () => {
      if (!audio || !ctx) {
        frame = requestAnimationFrame(draw);
        return;
      }
      const radius = Math.min(ctx.canvas.width, ctx.canvas.height) / 2;
      const centerX = ctx.canvas.width / 2;
      const centerY = ctx.canvas.height / 2;
      const baseRadius = radius / 4;
      ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

      analyser.getByteTimeDomainData(dataArray);
      const sliceRadians = (Math.PI * 2) / bufferLength;
      // draw line
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = strokeWidth;
      ctx.beginPath();
      for (let i = 0; i < bufferLength; i++) {
        const radians = sliceRadians * i;
        const radius = baseRadius + (dataArray[i] / 256) * baseRadius * 3;
        const x = centerX + radius * Math.cos(radians);
        const y = centerY + radius * Math.sin(radians);
        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.closePath();
      ctx.stroke();
      if (filled) {
        ctx.fillStyle = strokeColor;
        ctx.fill();
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
    strokeColor,
    filled,
    strokeWidth,
    smoothingTimeConstant,
  ]);

  return (
    <canvas {...props} ref={(canvas) => setCtx(canvas?.getContext("2d"))} />
  );
};

export default CircleWaveVisualizer;
