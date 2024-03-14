import { type HTMLAttributes, useState, useEffect } from "react";
import { FFTSize } from "../utils";

type Props = {
  audio?: HTMLAudioElement;
  fftSize?: FFTSize;
  bgColor?: string;
  strokeColor?: string;
  width?: number;
  height?: number;
  smoothingTimeConstant?: number;
} & HTMLAttributes<HTMLCanvasElement>;

const AudioWaveVisualizer = ({
  audio,
  fftSize = 16384,
  bgColor = "transparent",
  strokeColor = "rgb(0, 255, 144)",
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
      ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
      ctx.lineWidth = 2;
      if (audio.paused) {
        frame = requestAnimationFrame(draw);
        return;
      }
      analyser.getByteTimeDomainData(dataArray);
      ctx.strokeStyle = strokeColor;
      ctx.beginPath();
      const sliceWidth = ctx.canvas.width / bufferLength;
      for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 128.0;
        const y = (v * ctx.canvas.height) / 2;
        const x = i * sliceWidth;
        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.lineTo(ctx.canvas.width, ctx.canvas.height / 2);
      ctx.stroke();
      frame = requestAnimationFrame(draw);
    };
    draw();
    return () => (frame ? cancelAnimationFrame(frame) : undefined);
  }, [analyser, audio, audioContext, ctx, fftSize, bgColor, strokeColor]);

  return (
    <canvas {...props} ref={(canvas) => setCtx(canvas?.getContext("2d"))} />
  );
};

export default AudioWaveVisualizer;
