import { useEffect, useRef } from "react";
import type { Socket } from "socket.io-client";

export function useZipformerVI(
  socket: Socket | null,
  roomId: string | null,
  displayName: string,
  enabled: boolean
) {
  const recognizerRef = useRef<any>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const workletRef = useRef<AudioWorkletNode | null>(null);

  useEffect(() => {
    if (enabled && socket && roomId) {
      start(socket);
    } else {
      cleanup();
    }
    return cleanup;
  }, [enabled, roomId, socket]);

  async function start(activeSocket: Socket) {
    try {
      // @ts-ignore - Truy cập từ script /lib/sherpa-onnx.js đã load ở index.html
      const sherpa = window.sherpaOnnx; 

      if (!sherpa) {
        console.error("Sherpa-ONNX Web Engine chưa được tải! Hãy kiểm tra file trong public/lib/");
        return;
      }

      audioCtxRef.current = new AudioContext({ sampleRate: 16000 });
      await audioCtxRef.current.audioWorklet.addModule("/audio-processor.js");

      const mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const source = audioCtxRef.current.createMediaStreamSource(mediaStream);

      workletRef.current = new AudioWorkletNode(audioCtxRef.current, "audio-processor");
      source.connect(workletRef.current);
      workletRef.current.connect(audioCtxRef.current.destination);

      // CẤU HÌNH KHỚP VỚI FILE CỦA BẠN
      recognizerRef.current = sherpa.createOnlineRecognizer({
        modelConfig: {
          zipformer: {
            encoder: "/models/zipformer-de/encoder-epoch-12-avg-8.onnx", 
            decoder: "/models/zipformer-de/decoder-epoch-12-avg-8.onnx",
            joiner: "/models/zipformer-de/joiner-epoch-12-avg-8.onnx",
          },
          tokens: "/models/zipformer-de/tokens.txt",
          provider: "wasm",
          numThreads: 2,
        },
        decodingMethod: "greedy_search",
        enableEndpoint: true,
      });

      const stream = recognizerRef.current.createStream();

      workletRef.current.port.onmessage = (e) => {
        const samples = e.data as Float32Array;
        stream.acceptWaveform(16000, samples);
        while (recognizerRef.current.isReady(stream)) {
          recognizerRef.current.decode(stream);
        }
        const result = recognizerRef.current.getResult(stream);
        if (result.text) {
          activeSocket.emit("subtitle", { roomId, speaker: displayName, text: result.text });
        }
      };
    } catch (err) {
      console.error("Lỗi khởi tạo Zipformer:", err);
    }
  }

  function cleanup() {
    workletRef.current?.disconnect();
    recognizerRef.current?.free?.();
    audioCtxRef.current?.close();
  }
}