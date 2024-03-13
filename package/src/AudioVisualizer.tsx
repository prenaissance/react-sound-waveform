import { useRef } from "react";

const AudioVisualizer = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  return <canvas ref={canvasRef} />;
};

export default AudioVisualizer;
