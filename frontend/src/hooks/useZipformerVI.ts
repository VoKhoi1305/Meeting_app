

import { useEffect, useRef, useState } from "react";
import type { Socket } from "socket.io-client";

declare global {
  interface Window {
    sherpaOnnx: any;
  }
}

export function useZipformerVI(
  socket: Socket | null,
  roomId: string | null,
  displayName: string,
  enabled: boolean
) {
  const [isModelReady, setIsModelReady] = useState(false);
  const recognizerRef = useRef<any>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const workletRef = useRef<AudioWorkletNode | null>(null);
  const streamRef = useRef<any>(null);
  const isInitializingRef = useRef<boolean>(false);

  useEffect(() => {
    let aborted = false;
    let checkInterval: ReturnType<typeof setInterval>;

    const internalCleanup = () => {
      if (workletRef.current) {
        workletRef.current.port.onmessage = null; // Ngắt listener
        workletRef.current.disconnect();
        workletRef.current = null;
      }
      if (streamRef.current) {
        try { streamRef.current.free(); } catch (e) {}
        streamRef.current = null;
      }
      if (recognizerRef.current) {
        try { recognizerRef.current.free(); } catch (e) {}
        recognizerRef.current = null;
      }
      if (audioCtxRef.current) {
        if (audioCtxRef.current.state !== "closed") {
          audioCtxRef.current.close();
        }
        audioCtxRef.current = null;
      }
      isInitializingRef.current = false;
      if (!aborted) setIsModelReady(false);
    };

    const start = async () => {
      if (isInitializingRef.current || aborted) return;
      if (audioCtxRef.current?.state === "running") return;

      try {
        isInitializingRef.current = true;
        const sherpa = window.sherpaOnnx;

        // 1. Setup AudioContext
        const audioCtx = new AudioContext({ sampleRate: 16000 });
        audioCtxRef.current = audioCtx;
        
        // Đảm bảo file này nằm đúng ở public/audio-processor.js
        await audioCtx.audioWorklet.addModule("/audio-processor.js");
        if (aborted) { internalCleanup(); return; }

        // 2. Setup Mic
        const mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        if (aborted) {
            mediaStream.getTracks().forEach(t => t.stop());
            internalCleanup();
            return;
        }

        const source = audioCtx.createMediaStreamSource(mediaStream);
        const worklet = new AudioWorkletNode(audioCtx, "audio-processor");
        workletRef.current = worklet;
        source.connect(worklet);
        worklet.connect(audioCtx.destination);

        // 3. Setup Model Zipformer (Tiếng Việt)
        const recognizer = sherpa.createOnlineRecognizer({
          modelConfig: {
            zipformer: {
              encoder: "/models/zipformer-vi/encoder-epoch-12-avg-8.onnx",
              decoder: "/models/zipformer-vi/decoder-epoch-12-avg-8.onnx",
              joiner: "/models/zipformer-vi/joiner-epoch-12-avg-8.onnx",
            },
            tokens: "/models/zipformer-vi/tokens.txt",
            provider: "wasm",
            numThreads: 2,
          },
          decodingMethod: "greedy_search",
          enableEndpoint: true,
        });

        recognizerRef.current = recognizer;
        streamRef.current = recognizer.createStream();

        // 4. Xử lý nhận dạng
        worklet.port.onmessage = (e) => {
          if (aborted) return;
          const samples = e.data as Float32Array;

          if (recognizerRef.current && streamRef.current) {
            streamRef.current.acceptWaveform(16000, samples);
            
            while (recognizerRef.current.isReady(streamRef.current)) {
              recognizerRef.current.decode(streamRef.current);
            }

            const result = recognizerRef.current.getResult(streamRef.current);
            const text = result.text;

            // 👇 QUAN TRỌNG: Sửa logic gửi Socket để khớp với useSpeechToText
            if (text && text.length > 0 && socket?.connected) {
                // Kiểm tra xem text có nội dung thực không (đôi khi model trả về chuỗi rỗng)
                const textToSend = text.trim();
                
                if (textToSend) {
                    socket.emit("send-subtitle", { // Đổi từ 'subtitle' -> 'send-subtitle'
                        roomId, 
                        text: textToSend,
                        displayName: displayName // Đổi từ 'speaker' -> 'displayName'
                    });
                    
                }
            }
          }
        };

        if (!aborted) {
            setIsModelReady(true);
            console.log("✅ Zipformer AI đã sẵn sàng và đang nghe!");
        }
        isInitializingRef.current = false;

      } catch (err) {
        console.error("❌ Lỗi khởi tạo Zipformer:", err);
        internalCleanup();
      }
    };

    // Kiểm tra thư viện Sherpa đã load chưa
    if (enabled && socket && roomId) {
        const checkLibrary = () => {
            if (aborted) return;
            if (typeof window.sherpaOnnx !== "undefined") {
                clearInterval(checkInterval);
                start();
            }
        };

        if (typeof window.sherpaOnnx !== "undefined") {
            start();
        } else {
            console.warn("⏳ Đang đợi thư viện Sherpa load...");
            checkInterval = setInterval(checkLibrary, 500);
        }
    } else {
        internalCleanup();
    }

    return () => {
      aborted = true;
      if (checkInterval) clearInterval(checkInterval);
      internalCleanup();
    };
  }, [enabled, roomId, socket, displayName]); // Thêm displayName vào deps để cập nhật tên khi đổi

  return { isModelReady };
}