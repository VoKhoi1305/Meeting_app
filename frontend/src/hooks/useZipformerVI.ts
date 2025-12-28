// import { useEffect, useRef } from "react";
// import type { Socket } from "socket.io-client";

// // Khai báo type cho window
// declare global {
//   interface Window {
//     sherpaOnnx: any;
//   }
// }

// export function useZipformerVI(
//   socket: Socket | null,
//   roomId: string | null,
//   displayName: string,
//   enabled: boolean
// ) {
//   const recognizerRef = useRef<any>(null);
//   const audioCtxRef = useRef<AudioContext | null>(null);
//   const workletRef = useRef<AudioWorkletNode | null>(null);
//   const streamRef = useRef<any>(null);
  
//   // Ref này để chặn việc start chạy chồng chéo
//   const isInitializingRef = useRef<boolean>(false);

//   useEffect(() => {
//     // Biến cờ để kiểm soát việc hủy khi component unmount
//     let aborted = false;
//     let checkInterval: ReturnType<typeof setInterval>;

//     // Hàm dọn dẹp nội bộ
//     const internalCleanup = () => {
//       // 1. Ngắt kết nối Worklet
//       if (workletRef.current) {
//         workletRef.current.disconnect();
//         workletRef.current = null;
//       }

//       // 2. Giải phóng Stream Sherpa
//       if (streamRef.current) {
//         try {
//             streamRef.current.free();
//         } catch(e) { /* Bỏ qua lỗi nếu đã free */ }
//         streamRef.current = null;
//       }

//       // 3. Giải phóng Recognizer
//       if (recognizerRef.current) {
//         try {
//             recognizerRef.current.free();
//         } catch(e) { /* Bỏ qua lỗi */ }
//         recognizerRef.current = null;
//       }

//       // 4. Đóng AudioContext
//       if (audioCtxRef.current) {
//         if (audioCtxRef.current.state !== "closed") {
//           audioCtxRef.current.close();
//         }
//         audioCtxRef.current = null;
//       }
      
//       isInitializingRef.current = false;
//     };

//     const start = async () => {
//       // Nếu đang khởi tạo hoặc đã bị hủy thì dừng ngay
//       if (isInitializingRef.current || aborted) return;
      
//       // Nếu AudioContext đang chạy tốt thì không tạo mới
//       if (audioCtxRef.current?.state === "running") return;

//       try {
//         isInitializingRef.current = true;
//         const sherpa = window.sherpaOnnx;

//         // --- BƯỚC 1: Khởi tạo AudioContext ---
//         const audioCtx = new AudioContext({ sampleRate: 16000 });
//         audioCtxRef.current = audioCtx;

//         // Tải Worklet (đường dẫn tuyệt đối từ public)
//         await audioCtx.audioWorklet.addModule("/audio-processor.js");

//         // KIỂM TRA LẠI: Nếu trong lúc await mà component bị hủy -> Dừng ngay
//         if (aborted) {
//             internalCleanup();
//             return;
//         }

//         // --- BƯỚC 2: Xin quyền Micro ---
//         const mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
//         if (aborted) {
//              mediaStream.getTracks().forEach(track => track.stop());
//              internalCleanup();
//              return;
//         }

//         const source = audioCtx.createMediaStreamSource(mediaStream);
//         const worklet = new AudioWorkletNode(audioCtx, "audio-processor");
//         workletRef.current = worklet;

//         source.connect(worklet);
//         worklet.connect(audioCtx.destination);

//         // --- BƯỚC 3: Khởi tạo Sherpa AI ---
//         // Cấu hình Model Tiếng Việt
//         const recognizer = sherpa.createOnlineRecognizer({
//           modelConfig: {
//             zipformer: {
//               encoder: "/models/zipformer-vi/encoder-epoch-12-avg-8.onnx",
//               decoder: "/models/zipformer-vi/decoder-epoch-12-avg-8.onnx",
//               joiner: "/models/zipformer-vi/joiner-epoch-12-avg-8.onnx",
//             },
//             tokens: "/models/zipformer-vi/tokens.txt",
//             provider: "wasm",
//             numThreads: 2,
//           },
//           decodingMethod: "greedy_search",
//           enableEndpoint: true,
//         });

//         recognizerRef.current = recognizer;
//         const stream = recognizer.createStream();
//         streamRef.current = stream;

//         // --- BƯỚC 4: Xử lý sự kiện Audio ---
//         worklet.port.onmessage = (e) => {
//           if (aborted) return; // Nếu đã hủy thì không xử lý tin nhắn cũ
          
//           const samples = e.data as Float32Array;
          
//           // Kiểm tra kỹ các object còn tồn tại không trước khi dùng
//           if (recognizerRef.current && streamRef.current) {
//             streamRef.current.acceptWaveform(16000, samples);
            
//             while (recognizerRef.current.isReady(streamRef.current)) {
//               recognizerRef.current.decode(streamRef.current);
//             }
            
//             const result = recognizerRef.current.getResult(streamRef.current);
            
//             // Chỉ gửi khi có text và socket đang kết nối
//             if (result.text && result.text.length > 0 && socket?.connected) {
//               const text = result.text.trim();
//               if (text) {
//                   // Gửi kết quả lên Server
//                   socket.emit("subtitle", { 
//                       roomId, 
//                       speaker: displayName, 
//                       text: text 
//                   });
//                   // Quan trọng: Reset stream text sau khi gửi để tránh lặp lại câu cũ
//                   // (Tùy thuộc vào logic hiển thị của bạn, nhưng với stream liên tục thì Sherpa tự quản lý)
//               }
//             }
//           }
//         };

//         isInitializingRef.current = false;
//         console.log("✅ Sherpa-ONNX (Tiếng Việt) đã khởi động thành công!");

//       } catch (err) {
//         console.error("❌ Lỗi khởi tạo Zipformer:", err);
//         internalCleanup();
//       }
//     };

//     // Logic kiểm tra thư viện và bắt đầu
//     if (enabled && socket && roomId) {
//         const checkLibrary = () => {
//             if (aborted) return;
            
//             if (typeof window.sherpaOnnx !== "undefined") {
//                 if (checkInterval) clearInterval(checkInterval);
//                 start();
//             }
//         };

//         // Kiểm tra ngay lập tức
//         if (typeof window.sherpaOnnx !== "undefined") {
//             start();
//         } else {
//             console.warn("⏳ Đang đợi thư viện Sherpa-ONNX tải xong...");
//             checkInterval = setInterval(checkLibrary, 500);
//         }
//     } else {
//         // Nếu enabled = false, dọn dẹp ngay
//         internalCleanup();
//     }

//     return () => {
//       aborted = true; // Đặt cờ hủy để chặn các hàm async đang chạy dở
//       if (checkInterval) clearInterval(checkInterval);
//       internalCleanup();
//     };
  
//   }, [enabled, roomId, socket, displayName]); 
// }

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
  const lastTextRef = useRef<string>("");

  useEffect(() => {
    let aborted = false;
    let checkInterval: ReturnType<typeof setInterval>;

    const internalCleanup = () => {
      console.log("🧹 Đang dọn dẹp tài nguyên Zipformer...");
      if (workletRef.current) {
        workletRef.current.port.onmessage = null;
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
      // LOG 1: Kiểm tra xem hàm start có được gọi không
      console.log("🚀 [Zipformer] Bắt đầu khởi động...");
      
      if (isInitializingRef.current || aborted) {
          console.warn("⚠️ [Zipformer] Đang khởi tạo hoặc đã bị hủy, bỏ qua.");
          return;
      }
      
      try {
        isInitializingRef.current = true;
        const sherpa = window.sherpaOnnx;

        // --- BƯỚC 1: TẠO AUDIO CONTEXT ---
        const audioCtx = new AudioContext({ sampleRate: 16000 });
        audioCtxRef.current = audioCtx;
        
        // QUAN TRỌNG: Kiểm tra và Resume nếu bị treo
        if (audioCtx.state === 'suspended') {
            console.warn("⚠️ [Zipformer] AudioContext đang bị treo (suspended). Đang thử resume...");
            await audioCtx.resume();
        }
        console.log("🔊 [Zipformer] AudioContext State:", audioCtx.state);

        // Load Worklet
        console.log("📂 [Zipformer] Đang tải audio-processor.js...");
        try {
            await audioCtx.audioWorklet.addModule("/audio-processor.js");
            console.log("✅ [Zipformer] Tải audio-processor.js thành công");
        } catch (e) {
            console.error("❌ [Zipformer] Không tìm thấy file /audio-processor.js trong public!", e);
            throw e;
        }

        if (aborted) { internalCleanup(); return; }

        // --- BƯỚC 2: KẾT NỐI MICRO ---
        console.log("🎤 [Zipformer] Đang xin quyền Micro...");
        const mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        
        const track = mediaStream.getAudioTracks()[0];
        console.log(`🎤 [Zipformer] Micro OK: ${track.label} (Enabled: ${track.enabled})`);

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
        console.log("🔗 [Zipformer] Đã nối dây: Micro -> Worklet -> Speaker");

        // --- BƯỚC 3: LOAD MODEL ---
        console.log("🧠 [Zipformer] Đang tải Model (có thể mất vài giây)...");
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
            debug: true, // Bật chế độ debug của Sherpa
          },
          decodingMethod: "greedy_search",
          enableEndpoint: true,
        });

        recognizerRef.current = recognizer;
        streamRef.current = recognizer.createStream();
        console.log("🎉 [Zipformer] Model đã sẵn sàng!");

        // --- BƯỚC 4: XỬ LÝ SỰ KIỆN ---
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

            if (text && text.length > 0) {
                // LOG KHI CÓ CHỮ
                console.log("🎯 [AI NGHE]:", text);

                if (socket && socket.connected) {
                    const textToSend = text.trim();
                    if (textToSend !== lastTextRef.current) {
                        console.log(`📤 [Socket] Gửi: "${textToSend}" (User: ${displayName})`);
                        
                        socket.emit("send-subtitle", { 
                            roomId, 
                            text: textToSend,
                            displayName: displayName 
                        });
                        
                        lastTextRef.current = textToSend;

                        // Reset nếu hết câu
                        if (recognizerRef.current.isEndpoint(streamRef.current)) {
                            console.log("⏹️ [AI] Hết câu (Endpoint detected).");
                            recognizerRef.current.reset(streamRef.current);
                            lastTextRef.current = "";
                        }
                    }
                } else {
                    console.warn("⚠️ [Socket] Có chữ nhưng Socket chưa kết nối hoặc bị null!");
                }
            }
          }
        };

        if (!aborted) {
            setIsModelReady(true);
        }
        isInitializingRef.current = false;

      } catch (err) {
        console.error("❌ [Zipformer] Lỗi CHẾT NGƯỜI trong hàm Start:", err);
        internalCleanup();
      }
    };

    // Kiểm tra thư viện và chạy
    if (enabled && socket && roomId) {
        const checkLibrary = () => {
            if (aborted) return;
           if (
              window.sherpaOnnx &&
              typeof window.sherpaOnnx.createOnlineRecognizer === "function"
            ) {
              start();
            } else {
                console.log("⏳ [Zipformer] Đang đợi window.sherpaOnnx...");
            }
        };

        if (typeof window.sherpaOnnx !== "undefined") {
            start();
        } else {
            checkInterval = setInterval(checkLibrary, 500);
        }
    } else {
        console.log("zzz [Zipformer] Chưa đủ điều kiện chạy (enabled/socket/roomId thiếu).");
        internalCleanup();
    }

    return () => {
      aborted = true;
      if (checkInterval) clearInterval(checkInterval);
      internalCleanup();
    };
  }, [enabled, roomId, socket, displayName]);

  return { isModelReady };
}