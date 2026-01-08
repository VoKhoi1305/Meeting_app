import { useEffect, useRef, useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { Socket } from 'socket.io-client';
import type { AppDispatch } from '../store/store';
import { setParticipantStream, updateParticipant } from '../store/slices/participantsSlice';
import { createPeerConnection } from '../utils/webrtc-utils';
import { WEBSOCKET_EVENTS } from '../constants/meeting.constants';
import { updateSubtitle, removeSubtitle } from '../store/slices/subtitleSlice';
interface PeerConnectionWrapper {
  peerId: string;
  connection: RTCPeerConnection;
}

export const useWebRTC = (
  webrtcSocket: Socket | null,
  roomId: string | null,
  localStream: MediaStream | null
) => {
  const dispatch = useDispatch<AppDispatch>();
  const peerConnections = useRef<Map<string, PeerConnectionWrapper>>(new Map());
  const localStreamRef = useRef<MediaStream | null>(null);
  const subtitleTimeouts = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const hasJoinedRef = useRef(false);

  useEffect(() => {
    localStreamRef.current = localStream;
  }, [localStream]);

  //update tracks when localStream change
  useEffect(() => {
    if (!localStream) return;

    const videoTrack = localStream.getVideoTracks()[0];
    const audioTrack = localStream.getAudioTracks()[0];

    peerConnections.current.forEach((pcWrapper) => {
      const pc = pcWrapper.connection;
      const senders = pc.getSenders();

      const videoSender = senders.find((s) => s.track?.kind === 'video');
      if (videoSender && videoTrack) {
        videoSender.replaceTrack(videoTrack).catch((err) => 
          console.error('Lỗi replace video track:', err)
        );
      } else if (!videoSender && videoTrack) {
        // pc.addTrack(videoTrack, localStream); 
      }

      const audioSender = senders.find((s) => s.track?.kind === 'audio');
      if (audioSender && audioTrack) {
        audioSender.replaceTrack(audioTrack).catch((err) => 
          console.error('Lỗi replace audio track:', err)
        );
      }
    });
  }, [localStream]);

//Peer Connection Management
  const createPeerConnectionForPeer = useCallback(
    (peerId: string): RTCPeerConnection => {
      if (peerConnections.current.has(peerId)) {
        return peerConnections.current.get(peerId)!.connection;
      }

      // console.log(`[WebRTC] Tạo kết nối với: ${peerId}`);
      const pc = createPeerConnection();

      // QUAN TRỌNG: Add Tracks từ localStreamRef (đảm bảo luôn mới nhất)
      const stream = localStreamRef.current;
      if (stream) {
        stream.getTracks().forEach((track) => {
          pc.addTrack(track, stream);
        });
      } else {
        // console.warn('Tạo PC nhưng chưa có LocalStream!');
      }

      // Handle Remote Stream
      pc.ontrack = (event) => {
        const [remoteStream] = event.streams;
        if (remoteStream) {
          // console.log(`[WebRTC] Nhận stream từ: ${peerId}`);
          dispatch(setParticipantStream({ peerId, stream: remoteStream }));
        }
      };

      // Handle ICE
      pc.onicecandidate = (event) => {
        if (event.candidate && webrtcSocket) {
          webrtcSocket.emit(WEBSOCKET_EVENTS.ICE_CANDIDATE, {
            target: peerId,
            candidate: event.candidate,
          });
        }
      };

      // Connection State
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

  const handleExistingParticipants = useCallback(({ participants }: { participants: any[] }) => {
    // console.log('[WebRTC] Người cũ trong phòng:', participants);
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
        .catch(e => console.error('offer error', e));
    });
  }, [createPeerConnectionForPeer, webrtcSocket, roomId]);

  const handleNewParticipant = useCallback(({ peerId }: { peerId: string }) => {
    // console.log('[WebRTC] Người mới vào:', peerId);
    createPeerConnectionForPeer(peerId);
  }, [createPeerConnectionForPeer]);

  const handleOffer = useCallback(async (data: { sender: string; offer: RTCSessionDescriptionInit }) => {
    try {
      const { sender, offer } = data;
      // console.log('[WebRTC] new offer:', sender);
      const pc = createPeerConnectionForPeer(sender);
      
      if (pc.signalingState !== "stable" && pc.signalingState !== "have-remote-offer") {
      }

      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      webrtcSocket?.emit(WEBSOCKET_EVENTS.ANSWER, {
        target: sender,
        answer: pc.localDescription,
      });
    } catch (error) {
      console.error('offer error:', error);
    }
  }, [createPeerConnectionForPeer, webrtcSocket]);

  const handleAnswer = useCallback(async (data: { sender: string; answer: RTCSessionDescriptionInit }) => {
    try {
      const pc = peerConnections.current.get(data.sender)?.connection;
      if (pc) {
        await pc.setRemoteDescription(new RTCSessionDescription(data.answer));
      }
    } catch (error) {
      console.error('answer error', error);
    }
  }, []);

  const handleIceCandidate = useCallback(async (data: { sender: string; candidate: RTCIceCandidateInit }) => {
    try {
      const pc = peerConnections.current.get(data.sender)?.connection;
      if (pc) {
        await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
      }
    } catch (error) {
      console.error('ice error', error);
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
    if (!webrtcSocket) return;

    webrtcSocket.on(WEBSOCKET_EVENTS.EXISTING_PARTICIPANTS, handleExistingParticipants);
    webrtcSocket.on(WEBSOCKET_EVENTS.NEW_PARTICIPANT, handleNewParticipant);
    webrtcSocket.on(WEBSOCKET_EVENTS.OFFER, handleOffer);
    webrtcSocket.on(WEBSOCKET_EVENTS.ANSWER, handleAnswer);
    webrtcSocket.on(WEBSOCKET_EVENTS.ICE_CANDIDATE, handleIceCandidate);
    webrtcSocket.on(WEBSOCKET_EVENTS.PARTICIPANT_LEFT, handleParticipantLeft);

    return () => {
      webrtcSocket.off(WEBSOCKET_EVENTS.EXISTING_PARTICIPANTS);
      webrtcSocket.off(WEBSOCKET_EVENTS.NEW_PARTICIPANT);
      webrtcSocket.off(WEBSOCKET_EVENTS.OFFER);
      webrtcSocket.off(WEBSOCKET_EVENTS.ANSWER);
      webrtcSocket.off(WEBSOCKET_EVENTS.ICE_CANDIDATE);
      webrtcSocket.off(WEBSOCKET_EVENTS.PARTICIPANT_LEFT);
    };
  }, [
    webrtcSocket, 
    handleExistingParticipants, 
    handleNewParticipant, 
    handleOffer, 
    handleAnswer, 
    handleIceCandidate, 
    handleParticipantLeft
  ]);

  //Join Room Logic 
  useEffect(() => {
    if (!webrtcSocket || !roomId || !localStream) return;
    if (hasJoinedRef.current) return;

    const joinWebRTCRoom = () => {
      console.log('[WebRTC] had stream -> Join Room send:', roomId);
      webrtcSocket.emit(WEBSOCKET_EVENTS.JOIN_ROOM, { roomId });
      hasJoinedRef.current = true;
    };

    if (webrtcSocket.connected) {
      joinWebRTCRoom();
    } else {
      webrtcSocket.once('connect', joinWebRTCRoom);
    }

    return () => {
      webrtcSocket.off('connect', joinWebRTCRoom);
      if (hasJoinedRef.current) {
        // console.log(' [WebRTC] leaving room:', roomId);
        webrtcSocket.emit('leave-room', { roomId });
        hasJoinedRef.current = false;
        peerConnections.current.forEach((p) => p.connection.close());
        peerConnections.current.clear();
      }
    };
  }, [webrtcSocket, roomId, localStream]); 

  const handleNewSubtitle = useCallback((data: { peerId: string; text: string; displayName: string }) => {
    dispatch(updateSubtitle(data));

    if (subtitleTimeouts.current.has(data.peerId)) {
      clearTimeout(subtitleTimeouts.current.get(data.peerId));
    }

    const timeout = setTimeout(() => {
      dispatch(removeSubtitle(data.peerId));
      subtitleTimeouts.current.delete(data.peerId);
    }, 3000);

    subtitleTimeouts.current.set(data.peerId, timeout);
  }, [dispatch]);

  useEffect(() => {
    if (!webrtcSocket) return;

    webrtcSocket.on('existing-participants', handleExistingParticipants);
    webrtcSocket.on('new-participant', handleNewParticipant);
    webrtcSocket.on('offer', handleOffer);
    webrtcSocket.on('answer', handleAnswer);
    webrtcSocket.on('ice-candidate', handleIceCandidate);
    webrtcSocket.on('participant-left', handleParticipantLeft);
    webrtcSocket.on('new-subtitle', handleNewSubtitle); 

    return () => {
      webrtcSocket.off('existing-participants');
      webrtcSocket.off('new-participant');
      webrtcSocket.off('offer');
      webrtcSocket.off('answer');
      webrtcSocket.off('ice-candidate');
      webrtcSocket.off('participant-left');
      webrtcSocket.off('new-subtitle'); 
      subtitleTimeouts.current.forEach(clearTimeout);
    };
  }, [webrtcSocket, handleExistingParticipants, handleNewParticipant, handleOffer, handleAnswer, handleIceCandidate, handleParticipantLeft, handleNewSubtitle]);


  return { peerConnections: peerConnections.current };
};