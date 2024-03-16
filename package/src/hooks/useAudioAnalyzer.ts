import { useEffect, useState } from "react";
import { FFTSize } from "..";

type UseAudioAnalyzerOptions = {
  audio?: HTMLAudioElement | null;
  fftSize: FFTSize;
  smoothingTimeConstant: number;
};

const audioContext = new AudioContext();
const analyser = audioContext.createAnalyser();

const mediaSourceMap = new WeakMap<
  HTMLAudioElement,
  MediaElementAudioSourceNode
>();

const getAudioMediaSource = (audio: HTMLAudioElement) => {
  if (mediaSourceMap.has(audio)) {
    return mediaSourceMap.get(audio);
  }
  const source = audioContext.createMediaElementSource(audio);
  mediaSourceMap.set(audio, source);
  return source;
};

export const useAudioAnalyzer = ({
  audio,
  fftSize,
  smoothingTimeConstant,
}: UseAudioAnalyzerOptions) => {
  const [src, setSrc] = useState(audio?.src);
  const source = audio ? getAudioMediaSource(audio) : undefined;

  useEffect(() => {
    console.log("src", src);
    audioContext.resume();
    return () => {
      audioContext.suspend();
    };
  }, [src]);

  useEffect(() => {
    analyser.fftSize = fftSize;
    analyser.smoothingTimeConstant = smoothingTimeConstant;
  }, [fftSize, smoothingTimeConstant]);

  useEffect(() => {
    if (!audio) return;
    const mutationObserver = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === "src") {
          setSrc(audio?.src);
        }
      });
    });

    mutationObserver.observe(audio, { attributes: true });
  }, [audio]);

  useEffect(() => {
    if (!audio || !source) return;
    source.connect(analyser);
    analyser.connect(audioContext.destination);
    return () => {
      source.disconnect();
      analyser.disconnect();
    };
  }, [audio, source]);

  return { audioContext, analyser };
};
