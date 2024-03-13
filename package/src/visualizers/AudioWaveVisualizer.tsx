import { type HTMLAttributes, useRef, useState, useEffect } from "react";
import { FFTSize } from "../utils";

type Props = {
  audio?: HTMLAudioElement;
  fftSize?: FFTSize;
  bgColor?: string;
  width?: number;
  height?: number;
  smoothingTimeConstant?: number;
} & HTMLAttributes<HTMLCanvasElement>;

const AudioWaveVisualizer = ({
  audio,
  fftSize = 2048,
  bgColor = "transparent",
  smoothingTimeConstant = 0.8,
  ...props
}: Props) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [audioContext] = useState(() => new AudioContext());
  const [analyser] = useState(() => audioContext.createAnalyser());
  const frameRef = useRef<number | null>(null);
  const ctx = canvasRef.current?.getContext("2d");

  useEffect(() => {
    audioContext.resume();
    return () => void audioContext.suspend();
  }, [audioContext]);

  useEffect(() => {
    if (!audio) return;

    const source = audioContext.createMediaElementSource(audio);
    const amplifier = audioContext.createGain();
    amplifier.gain.value = 5;
    source.connect(amplifier);
    amplifier.connect(analyser);

    analyser.connect(audioContext.destination);
    analyser.fftSize = fftSize;
    analyser.smoothingTimeConstant = smoothingTimeConstant;
    return () => {
      source.disconnect();
      analyser.disconnect();
    };
  }, [audio, audioContext, analyser, fftSize, smoothingTimeConstant]);

  useEffect(() => {
    if (!audio || !ctx) return;

    const bufferLength = analyser.frequencyBinCount;
    console.log(bufferLength);
    const dataArray = new Uint8Array(bufferLength);
    const draw = () => {
      analyser.getByteTimeDomainData(dataArray);
      ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
      ctx.lineWidth = 2;
      if (audio.paused) {
        frameRef.current = requestAnimationFrame(draw);
        return;
      }

      ctx.strokeStyle = "rgb(0, 255, 144)";
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
      frameRef.current = requestAnimationFrame(draw);
    };
    draw();
    return () =>
      frameRef.current ? cancelAnimationFrame(frameRef.current) : undefined;
  }, [analyser, audio, audioContext, ctx, fftSize, bgColor]);

  return <canvas {...props} ref={canvasRef} />;
};

export default AudioWaveVisualizer;
