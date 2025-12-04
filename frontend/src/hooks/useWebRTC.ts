import { useEffect, useRef, useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { Socket } from 'socket.io-client';
import type { AppDispatch } from '../store/store';
import { setParticipantStream, updateParticipant } from '../store/slices/participantsSlice';
import { createPeerConnection } from '../utils/webrtc-utils';
import { WEBSOCKET_EVENTS } from '../constants/meeting.constants';

interface PeerConnection {
  peerId: string;
  connection: RTCPeerConnection;
}

export const useWebRTC = (
  webrtcSocket: Socket | null,
  roomId: string | null,
  localStream: MediaStream | null
) => {
  const dispatch = useDispatch<AppDispatch>();
  const peerConnections = useRef<Map<string, PeerConnection>>(new Map());
  
  const localStreamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    localStreamRef.current = localStream;
  }, [localStream]);

  const createPeerConnectionForPeer = useCallback(
    (peerId: string): RTCPeerConnection => {
    
      if (peerConnections.current.has(peerId)) {
        return peerConnections.current.get(peerId)!.connection;
      }

      const pc = createPeerConnection();

      // Thêm track từ stream hiện tại vào kết nối
      const stream = localStreamRef.current;
      if (stream) {
        stream.getTracks().forEach((track) => {
          pc.addTrack(track, stream);
        });
      }

      pc.ontrack = (event) => {
        const [remoteStream] = event.streams;
        if (remoteStream) {
          console.log(`🎥 Nhận được video từ: ${peerId}`);
          dispatch(setParticipantStream({ peerId, stream: remoteStream }));
        }
      };

      pc.onicecandidate = (event) => {
        if (event.candidate && webrtcSocket) {
          webrtcSocket.emit(WEBSOCKET_EVENTS.ICE_CANDIDATE, {
            target: peerId,
            candidate: event.candidate,
          });
        }
      };

      // Theo dõi trạng thái kết nối
      pc.onconnectionstatechange = () => {
        console.log(`🔌 Trạng thái kết nối ${peerId}:`, pc.connectionState);
        let status = 'connecting';
        if (pc.connectionState === 'connected') status = 'connected';
        if (pc.connectionState === 'failed' || pc.connectionState === 'closed') status = 'disconnected';
        
        dispatch(updateParticipant({
          id: peerId,
          updates: { connectionStatus: status as any },
        }));
      };

      peerConnections.current.set(peerId, { peerId, connection: pc });
      return pc;
    },
    [webrtcSocket, dispatch]
  );

  // --- Xử lý tín hiệu WebRTC ---

  const handleNewParticipant = useCallback(({ peerId }: { peerId: string }) => {
    console.log('🆕 Người mới vào, bắt đầu kết nối với:', peerId);
    const pc = createPeerConnectionForPeer(peerId);
    pc.createOffer()
      .then((offer) => pc.setLocalDescription(offer))
      .then(() => {
        webrtcSocket?.emit(WEBSOCKET_EVENTS.OFFER, {
          target: peerId,
          offer: pc.localDescription,
          roomId,
        });
      })
      .catch((e) => console.error('Lỗi tạo Offer:', e));
  }, [createPeerConnectionForPeer, roomId, webrtcSocket]);

  const handleOffer = useCallback(async (data: { sender: string; offer: RTCSessionDescriptionInit }) => {
    try {
      const { sender, offer } = data;
      console.log('📥 Nhận yêu cầu kết nối từ:', sender);
      
      // Khi nhận yêu cầu mới, reset kết nối cũ nếu có để tránh lỗi
      if (peerConnections.current.has(sender)) {
        peerConnections.current.get(sender)?.connection.close();
        peerConnections.current.delete(sender);
      }
      
      const pc = createPeerConnectionForPeer(sender);
      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      webrtcSocket?.emit(WEBSOCKET_EVENTS.ANSWER, {
        target: sender,
        answer: pc.localDescription,
      });
    } catch (error) {
      console.error('Lỗi xử lý Offer:', error);
    }
  }, [createPeerConnectionForPeer, webrtcSocket]);

  const handleAnswer = useCallback(async (data: { sender: string; answer: RTCSessionDescriptionInit }) => {
    try {
      const pc = peerConnections.current.get(data.sender)?.connection;
      if (pc) {
        console.log('✅ Đã nhận chấp nhận kết nối từ:', data.sender);
        await pc.setRemoteDescription(new RTCSessionDescription(data.answer));
      }
    } catch (error) {
      console.error('Lỗi xử lý Answer:', error);
    }
  }, []);

  const handleIceCandidate = useCallback(async (data: { sender: string; candidate: RTCIceCandidateInit }) => {
    try {
      const pc = peerConnections.current.get(data.sender)?.connection;
      if (pc) {
        await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
      }
    } catch (error) {
      console.error('Lỗi xử lý ICE:', error);
    }
  }, []);

  const handleParticipantLeft = useCallback(({ peerId }: { peerId: string }) => {
    if (peerConnections.current.has(peerId)) {
      peerConnections.current.get(peerId)?.connection.close();
      peerConnections.current.delete(peerId);
      dispatch(setParticipantStream({ peerId, stream: undefined as any }));
    }
  }, [dispatch]);

  useEffect(() => {
    if (!webrtcSocket || !roomId) return;

    webrtcSocket.emit(WEBSOCKET_EVENTS.JOIN_ROOM, { roomId });

    webrtcSocket.on(WEBSOCKET_EVENTS.NEW_PARTICIPANT, handleNewParticipant);
    webrtcSocket.on(WEBSOCKET_EVENTS.OFFER, handleOffer);
    webrtcSocket.on(WEBSOCKET_EVENTS.ANSWER, handleAnswer);
    webrtcSocket.on(WEBSOCKET_EVENTS.ICE_CANDIDATE, handleIceCandidate);
    webrtcSocket.on(WEBSOCKET_EVENTS.PARTICIPANT_LEFT, handleParticipantLeft);
    
    webrtcSocket.on(WEBSOCKET_EVENTS.EXISTING_PARTICIPANTS, ({ participants }) => {
      participants.forEach((p: any) => handleNewParticipant({ peerId: p.peerId }));
    });

    return () => {
      webrtcSocket.off(WEBSOCKET_EVENTS.NEW_PARTICIPANT);
      webrtcSocket.off(WEBSOCKET_EVENTS.OFFER);
      webrtcSocket.off(WEBSOCKET_EVENTS.ANSWER);
      webrtcSocket.off(WEBSOCKET_EVENTS.ICE_CANDIDATE);
      webrtcSocket.off(WEBSOCKET_EVENTS.PARTICIPANT_LEFT);
      webrtcSocket.off(WEBSOCKET_EVENTS.EXISTING_PARTICIPANTS);
      
      peerConnections.current.forEach((p) => p.connection.close());
      peerConnections.current.clear();
    };
  }, [webrtcSocket, roomId, handleNewParticipant, handleOffer, handleAnswer, handleIceCandidate, handleParticipantLeft]);

  useEffect(() => {
    if (!localStream) return;

    peerConnections.current.forEach(({ connection }) => {
      const senders = connection.getSenders();
      const audioTrack = localStream.getAudioTracks()[0];
      const videoTrack = localStream.getVideoTracks()[0];

      if (senders.length === 0) {
        localStream.getTracks().forEach((track) => connection.addTrack(track, localStream));
        return;
      }

      senders.forEach((sender) => {
        if (sender.track?.kind === 'audio' && audioTrack) {
          sender.replaceTrack(audioTrack).catch(console.error);
        }
        if (sender.track?.kind === 'video' && videoTrack) {
          sender.replaceTrack(videoTrack).catch(console.error);
        }
      });
    });
  }, [localStream]);

  return { peerConnections: peerConnections.current };
};