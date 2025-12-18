import { useEffect, useRef } from 'react';
import { Socket } from 'socket.io-client';

export const useSpeechToText = (
  webrtcSocket: Socket | null,
  roomId: string | null,
  isEnabled: boolean
) => {
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    // Kiểm tra trình duyệt hỗ trợ
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognition || !isEnabled || !webrtcSocket || !roomId) {
      if (recognitionRef.current) recognitionRef.current.stop();
      return;
    }

    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;
    
    recognition.continuous = true;
    recognition.interimResults = false; 
    recognition.lang = 'vi-VN';

    recognition.onresult = (event: any) => {
      const transcript = event.results[event.results.length - 1][0].transcript;
      if (transcript.trim()) {
        webrtcSocket.emit('send-subtitle', { roomId, text: transcript });
      }
    };

    recognition.onerror = (event: any) => console.error('Speech recognition error', event.error);
    
    try {
      recognition.start();
    } catch (e) {
      console.warn("Recognition already started");
    }

    return () => {
      recognition.stop();
    };
  }, [webrtcSocket, roomId, isEnabled]);
};