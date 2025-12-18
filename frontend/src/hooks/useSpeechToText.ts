import { useEffect, useRef } from 'react';
import { Socket } from 'socket.io-client';

export const useSpeechToText = (
  webrtcSocket: Socket | null,
  roomId: string | null,
  displayName: string,
  isEnabled: boolean
) => {
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognition || !isEnabled || !webrtcSocket || !roomId) {
      if (recognitionRef.current) recognitionRef.current.stop();
      return;
    }

    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;
    
    recognition.continuous = true;
    recognition.interimResults = true; 
    recognition.lang = 'vi-VN';

    recognition.onresult = (event: any) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }

      const textToSend = finalTranscript || interimTranscript;
      
      if (textToSend.trim()) {
        webrtcSocket.emit('send-subtitle', { 
          roomId, 
          text: textToSend,
          displayName 
        });
      }
    };

    recognition.onerror = (event: any) => {
      if (event.error === 'not-allowed') console.error('Microphone access denied');
    };

    recognition.onend = () => {
      if (isEnabled) {
        try { recognition.start(); } catch (e) {}
      }
    };
    
    try {
      recognition.start();
    } catch (e) {}

    return () => {
      recognition.onend = null;
      recognition.stop();
    };
  }, [webrtcSocket, roomId, isEnabled, displayName]);
};