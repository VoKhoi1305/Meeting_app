

import { useEffect, useRef, useState } from "react";
import type { Socket } from "socket.io-client";

declare global {
  interface Window {
    SherpaModule: any;      
    OnlineRecognizer: any;  
    AudioContext: any;
    webkitAudioContext: any;
    Module: any;
  }
}

export function useZipformer(
  socket: Socket | null,
  roomId: string | null,
  displayName: string,
  enabled: boolean
) {
  const [isModelReady, setIsModelReady] = useState(false);
  const [statusText, setStatusText] = useState("⏳ Đang đợi..."); 
  
  const recognizerRef = useRef<any>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const workletRef = useRef<AudioWorkletNode | null>(null);
  const streamRef = useRef<any>(null);
  const lastTextRef = useRef<string>("");
  const isInitializingRef = useRef(false);

  useEffect(() => {
    if (!enabled || !roomId || !socket) return;
    if (isInitializingRef.current) return;

    isInitializingRef.current = true;
    let aborted = false;

    // --- HÀM DỌN DẸP ---
    const cleanup = () => {
      if (workletRef.current) {
        workletRef.current.port.onmessage = null;
        workletRef.current.disconnect();
        workletRef.current = null;
      }
      if (streamRef.current) {
        try { streamRef.current.free(); } catch {}
        streamRef.current = null;
      }
      if (audioCtxRef.current && audioCtxRef.current.state !== "closed") {
        audioCtxRef.current.close();
        audioCtxRef.current = null;
      }
      isInitializingRef.current = false;
      if (!aborted) setIsModelReady(false);
    };

    // --- LOAD SCRIPT ---
    const loadScriptAndInitWasm = (): Promise<void> => {
        return new Promise((resolve, reject) => {
            if (window.SherpaModule && window.OnlineRecognizer) {
                resolve();
                return;
            }
            window.Module = {
                onRuntimeInitialized: () => {
                    window.SherpaModule = window.Module;
                    if (typeof window.OnlineRecognizer === 'undefined') {
                        // @ts-ignore
                        window.OnlineRecognizer = OnlineRecognizer; 
                    }
                    resolve();
                },
                locateFile: (path: string) => path.endsWith('.wasm') ? '/lib/sherpa-onnx-wasm-main-asr.wasm' : path
            };
            const script = document.createElement('script');
            script.src = "/lib/sherpa-onnx.js";
            script.async = true;
            script.onerror = () => reject(new Error("Lỗi tải script sherpa-onnx.js"));
            document.body.appendChild(script);
        });
    };

    const initSherpa = async () => {
      try {
        setStatusText("⏳ Đang tải thư viện...");
        await loadScriptAndInitWasm();
        if (aborted) return;
        
        const SherpaModule = window.SherpaModule;
        const OnlineRecognizer = window.OnlineRecognizer;

        // --- MOUNT FILE ---
        const mountFile = async (url: string, filename: string) => {
           try {
             if (SherpaModule.FS.analyzePath("/" + filename).exists) return;
           } catch(e) {}
           const res = await fetch(url);
           if (!res.ok) throw new Error(`Lỗi tải ${url}`);
           const buffer = await res.arrayBuffer();
           SherpaModule.FS_createDataFile("/", filename, new Uint8Array(buffer), true, false, true);
        };

        setStatusText("📦 Đang tải Models...");
        await Promise.all([
          mountFile("/models/zipformer-en/encoder.onnx", "encoder.onnx"),
          mountFile("/models/zipformer-en/decoder.onnx", "decoder.onnx"),
          mountFile("/models/zipformer-en/joiner.onnx", "joiner.onnx"),
          mountFile("/models/zipformer-en/tokens.txt", "tokens.txt"),
        ]);

        setStatusText("⚙️ Đang cấu hình...");

        // --- CẤU HÌNH NGẮT CÂU (QUAN TRỌNG) ---
        const config = {
          featConfig: {
            sampleRate: 16000,
            featureDim: 80,
          },
          modelConfig: {
            transducer: {
               encoder: '/encoder.onnx', 
               decoder: '/decoder.onnx',
               joiner: '/joiner.onnx'
            },
            tokens: "/tokens.txt",
            numThreads: 1,
            provider: "cpu",
            debug: 0, 
            modelType: "zipformer",
          },
          decodingMethod: "greedy_search",
          enableEndpoint: 1, // Bật tính năng phát hiện điểm cuối
          
          // Rule 1: Nếu im lặng trong 2.0 giây sau khi đã nói gì đó -> Ngắt câu
          rule1MinTrailingSilence: 2.0, 
          
          // Rule 2: Nếu im lặng trong 1.2 giây (dự phòng cho câu ngắn) -> Ngắt
          rule2MinTrailingSilence: 1.2, 
          
          // Rule 3: Nếu câu dài quá 20s mà chưa ngắt -> Bắt buộc ngắt
          rule3MinUtteranceLength: 20,
        };

        if (!recognizerRef.current) {
             recognizerRef.current = new OnlineRecognizer(config, SherpaModule);
        }
        
        // --- AUDIO SETUP ---
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        const audioCtx = new AudioContext({ sampleRate: 16000 });
        audioCtxRef.current = audioCtx;
        
        try {
            await audioCtx.audioWorklet.addModule("/lib/audio-processor.js");
        } catch(e) {
            await audioCtx.audioWorklet.addModule("/audio-processor.js");
        }

        const userMedia = await navigator.mediaDevices.getUserMedia({ audio: true });
        const source = audioCtx.createMediaStreamSource(userMedia);
        const worklet = new AudioWorkletNode(audioCtx, "audio-processor");
        workletRef.current = worklet;
        
        source.connect(worklet);
        worklet.connect(audioCtx.destination);

        // Tạo Stream mới
        if (streamRef.current) {
            try { streamRef.current.free(); } catch {}
        }
        streamRef.current = recognizerRef.current.createStream();
        
        setIsModelReady(true);
        setStatusText("🟢 Đang nghe...");

        // --- XỬ LÝ KẾT QUẢ ---
        worklet.port.onmessage = (event) => {
           if (aborted) return;
           const float32Audio = event.data;
           
           if (recognizerRef.current && streamRef.current) {
              streamRef.current.acceptWaveform(16000, float32Audio);
              
              // Decode liên tục
              while (recognizerRef.current.isReady(streamRef.current)) {
                 recognizerRef.current.decode(streamRef.current);
              }

              // Lấy text hiện tại
              const result = recognizerRef.current.getResult(streamRef.current);
              const text = result.text;

              if (text && text.length > 0) {
                 const textToSend = text.trim();
                 
                 // Gửi text realtime (để hiển thị chữ đang chạy)
                 if (textToSend !== lastTextRef.current) {
                    if (socket && socket.connected) {
                       socket.emit("send-subtitle", { 
                           roomId, 
                           text: textToSend, 
                           displayName,
                           isFinal: false // Đánh dấu là chưa chốt câu
                       });
                    }
                    lastTextRef.current = textToSend;
                 }
              }

              // --- LOGIC NGẮT CÂU (QUAN TRỌNG) ---
              if (recognizerRef.current.isEndpoint(streamRef.current)) {
                  
                  // 1. Lấy toàn bộ câu chốt hạ
                  const finalText = recognizerRef.current.getResult(streamRef.current).text;
                  
                  if (finalText && finalText.length > 0) {
                    
                      if (socket && socket.connected) {
                          socket.emit("send-subtitle", { 
                              roomId, 
                              text: finalText, 
                              displayName,
                              isFinal: true // Đánh dấu đây là câu hoàn chỉnh
                          });
                      }
                  }

                  recognizerRef.current.reset(streamRef.current);
                  lastTextRef.current = ""; // Reset biến tạm
              }
           }
        };

      } catch (err: any) {
        console.error("❌ [Zipformer Error]:", err);
        setStatusText("Lỗi: " + err.message);
        cleanup();
      }
    };

    initSherpa();

    return () => {
      aborted = true;
      cleanup();
    };
  }, [enabled, roomId, socket, displayName]);

  return { isModelReady, statusText };
}