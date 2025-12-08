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
  const hasJoinedWebRTCRef = useRef(false);

  // Cập nhật ref stream
  useEffect(() => {
    localStreamRef.current = localStream;
  }, [localStream]);

  // --- Hàm tạo PeerConnection ---
  const createPeerConnectionForPeer = useCallback(
    (peerId: string): RTCPeerConnection => {
      if (peerConnections.current.has(peerId)) {
        return peerConnections.current.get(peerId)!.connection;
      }

      console.log(`🛠 [WebRTC] Tạo kết nối với: ${peerId}`);
      const pc = createPeerConnection();

      // 1. Add Local Tracks
      const stream = localStreamRef.current;
      if (stream) {
        stream.getTracks().forEach((track) => {
          pc.addTrack(track, stream);
        });
      }

      // 2. Handle Remote Stream
      pc.ontrack = (event) => {
        const [remoteStream] = event.streams;
        if (remoteStream) {
          console.log(`🎥 [WebRTC] Nhận video từ: ${peerId}`);
          dispatch(setParticipantStream({ peerId, stream: remoteStream }));
        }
      };

      // 3. Handle ICE
      pc.onicecandidate = (event) => {
        if (event.candidate && webrtcSocket) {
          webrtcSocket.emit(WEBSOCKET_EVENTS.ICE_CANDIDATE, {
            target: peerId,
            candidate: event.candidate,
          });
        }
      };

      // 4. Connection State
      pc.onconnectionstatechange = () => {
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

  // --- Handlers ---
  const handleExistingParticipants = useCallback(({ participants }: { participants: any[] }) => {
    console.log('👥 [WebRTC] Người cũ trong phòng:', participants);
    participants.forEach((p) => {
      const peerId = p.peerId;
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
        .catch(e => console.error('❌ Lỗi tạo Offer:', e));
    });
  }, [createPeerConnectionForPeer, webrtcSocket, roomId]);

  const handleNewParticipant = useCallback(({ peerId }: { peerId: string }) => {
    console.log('🆕 [WebRTC] Người mới vào (Chờ Offer):', peerId);
    createPeerConnectionForPeer(peerId);
  }, [createPeerConnectionForPeer]);

  const handleOffer = useCallback(async (data: { sender: string; offer: RTCSessionDescriptionInit }) => {
    try {
      const { sender, offer } = data;
      console.log('📥 [WebRTC] Nhận Offer từ:', sender);
      const pc = createPeerConnectionForPeer(sender);
      
      if (pc.signalingState !== "stable") {
        // Rollback nếu cần, hoặc bỏ qua để tránh conflict
        return; 
      }

      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      webrtcSocket?.emit(WEBSOCKET_EVENTS.ANSWER, {
        target: sender,
        answer: pc.localDescription,
      });
    } catch (error) {
      console.error('❌ Lỗi xử lý Offer:', error);
    }
  }, [createPeerConnectionForPeer, webrtcSocket]);

  const handleAnswer = useCallback(async (data: { sender: string; answer: RTCSessionDescriptionInit }) => {
    try {
      const pc = peerConnections.current.get(data.sender)?.connection;
      if (pc) {
        await pc.setRemoteDescription(new RTCSessionDescription(data.answer));
      }
    } catch (error) {
      console.error('❌ Lỗi xử lý Answer:', error);
    }
  }, []);

  const handleIceCandidate = useCallback(async (data: { sender: string; candidate: RTCIceCandidateInit }) => {
    try {
      const pc = peerConnections.current.get(data.sender)?.connection;
      if (pc) {
        await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
      }
    } catch (error) {
      console.error('❌ Lỗi xử lý ICE:', error);
    }
  }, []);

  const handleParticipantLeft = useCallback(({ peerId }: { peerId: string }) => {
    if (peerConnections.current.has(peerId)) {
      peerConnections.current.get(peerId)?.connection.close();
      peerConnections.current.delete(peerId);
      dispatch(setParticipantStream({ peerId, stream: undefined as any }));
    }
  }, [dispatch]);

  // --- Main Effect ---
  useEffect(() => {
    if (!webrtcSocket || !roomId || !localStream) return;

    // Hàm thực hiện join room
    const joinWebRTCRoom = () => {
        if (hasJoinedWebRTCRef.current) return;
        console.log('🚀 [WebRTC] Gửi sự kiện Join Room:', roomId);
        webrtcSocket.emit(WEBSOCKET_EVENTS.JOIN_ROOM, { roomId });
        hasJoinedWebRTCRef.current = true;
    };

    // Chờ socket kết nối xong mới join
    if (webrtcSocket.connected) {
        joinWebRTCRoom();
    } else {
        webrtcSocket.on('connect', joinWebRTCRoom);
    }

    // Register Listeners
    webrtcSocket.on(WEBSOCKET_EVENTS.EXISTING_PARTICIPANTS, handleExistingParticipants);
    webrtcSocket.on(WEBSOCKET_EVENTS.NEW_PARTICIPANT, handleNewParticipant);
    webrtcSocket.on(WEBSOCKET_EVENTS.OFFER, handleOffer);
    webrtcSocket.on(WEBSOCKET_EVENTS.ANSWER, handleAnswer);
    webrtcSocket.on(WEBSOCKET_EVENTS.ICE_CANDIDATE, handleIceCandidate);
    webrtcSocket.on(WEBSOCKET_EVENTS.PARTICIPANT_LEFT, handleParticipantLeft);

    return () => {
      webrtcSocket.off('connect', joinWebRTCRoom);
      webrtcSocket.off(WEBSOCKET_EVENTS.EXISTING_PARTICIPANTS);
      webrtcSocket.off(WEBSOCKET_EVENTS.NEW_PARTICIPANT);
      webrtcSocket.off(WEBSOCKET_EVENTS.OFFER);
      webrtcSocket.off(WEBSOCKET_EVENTS.ANSWER);
      webrtcSocket.off(WEBSOCKET_EVENTS.ICE_CANDIDATE);
      webrtcSocket.off(WEBSOCKET_EVENTS.PARTICIPANT_LEFT);
      
      hasJoinedWebRTCRef.current = false;
      webrtcSocket.emit('leave-room', { roomId });
      
      peerConnections.current.forEach((p) => p.connection.close());
      peerConnections.current.clear();
    };
  }, [
    webrtcSocket, 
    roomId, 
    localStream, // Re-run khi stream thay đổi để add track
    handleExistingParticipants, 
    handleNewParticipant, 
    handleOffer, 
    handleAnswer, 
    handleIceCandidate, 
    handleParticipantLeft
  ]);

  return { peerConnections: peerConnections.current };
};