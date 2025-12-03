
// src/hooks/useWebRTC.ts - FIXED WITH TRACK REPLACEMENT
import { useEffect, useRef, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Socket } from 'socket.io-client';
import type { RootState, AppDispatch } from '../store/store';
import { setParticipantStream, updateParticipant } from '../store/slices/participantsSlice';
import { createPeerConnection } from '../utils/webrtc-utils';
import { WEBSOCKET_EVENTS } from '../constants/meeting.constants';
import toast from 'react-hot-toast';

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

  // Create peer connection for a specific peer
  const createPeerConnectionForPeer = useCallback(
    (peerId: string): RTCPeerConnection => {
      const pc = createPeerConnection();

      // Add local stream tracks
      if (localStream) {
        localStream.getTracks().forEach((track) => {
          pc.addTrack(track, localStream);
        });
      }
      pc.ontrack = (event) => {
        const [remoteStream] = event.streams;
        dispatch(setParticipantStream({ peerId, stream: remoteStream }));
      };

      // Handle ICE candidates
      pc.onicecandidate = (event) => {
        if (event.candidate && webrtcSocket) {
          webrtcSocket.emit(WEBSOCKET_EVENTS.ICE_CANDIDATE, {
            target: peerId,
            candidate: event.candidate,
          });
        }
      };

      pc.onconnectionstatechange = () => {
        console.log(`Connection state with ${peerId}:`, pc.connectionState);
        
        if (pc.connectionState === 'connected') {
          dispatch(
            updateParticipant({
              id: peerId,
              updates: { connectionStatus: 'connected' },
            })
          );
        } else if (
          pc.connectionState === 'failed' ||
          pc.connectionState === 'disconnected'
        ) {
          dispatch(
            updateParticipant({
              id: peerId,
              updates: { connectionStatus: 'disconnected' },
            })
          );
        }
      };

      peerConnections.current.set(peerId, { peerId, connection: pc });
      return pc;
    },
    [localStream, webrtcSocket, dispatch]
  );

  // Create and send offer
  const createOffer = useCallback(
    async (peerId: string) => {
      try {
        const pc = createPeerConnectionForPeer(peerId);

        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

        if (webrtcSocket) {
          webrtcSocket.emit(WEBSOCKET_EVENTS.OFFER, {
            target: peerId,
            offer: pc.localDescription,
            roomId,
          });
        }

        console.log('📤 Sent offer to', peerId);
      } catch (error) {
        console.error('Error creating offer:', error);
        toast.error('Failed to establish connection');
      }
    },
    [webrtcSocket, roomId, createPeerConnectionForPeer]
  );

  // Handle incoming offer
  const handleOffer = useCallback(
    async (data: { sender: string; offer: RTCSessionDescriptionInit }) => {
      try {
        const { sender, offer } = data;
        console.log('📥 Received offer from', sender);

        const pc = createPeerConnectionForPeer(sender);
        await pc.setRemoteDescription(new RTCSessionDescription(offer));

        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        if (webrtcSocket) {
          webrtcSocket.emit(WEBSOCKET_EVENTS.ANSWER, {
            target: sender,
            answer: pc.localDescription,
          });
        }

        console.log('📤 Sent answer to', sender);
      } catch (error) {
        console.error('Error handling offer:', error);
      }
    },
    [webrtcSocket, createPeerConnectionForPeer]
  );

  // Handle incoming answer
  const handleAnswer = useCallback(
    async (data: { sender: string; answer: RTCSessionDescriptionInit }) => {
      try {
        const { sender, answer } = data;
        const peer = peerConnections.current.get(sender);
        if (peer) {
          await peer.connection.setRemoteDescription(new RTCSessionDescription(answer));
        }
      } catch (error) {
        console.error('Error handling answer:', error);
      }
    },
    []
  );

  const handleIceCandidate = useCallback(
    async (data: { sender: string; candidate: RTCIceCandidateInit }) => {
      try {
        const { sender, candidate } = data;
        const peer = peerConnections.current.get(sender);

        if (peer && candidate) {
          await peer.connection.addIceCandidate(new RTCIceCandidate(candidate));
        }
      } catch (error) {
        console.error('Error handling ICE candidate:', error);
      }
    },
    []
  );


  const handleNewParticipant = useCallback(
    (data: { peerId: string }) => {
      createOffer(data.peerId);
    },
    [createOffer]
  );

  const handleExistingParticipants = useCallback(
    (data: { participants: { peerId: string }[] }) => {
      data.participants.forEach((participant) => {
        createOffer(participant.peerId);
      });
    },
    [createOffer]
  );

  const handleParticipantLeft = useCallback((data: { peerId: string }) => {
    const peer = peerConnections.current.get(data.peerId);
    if (peer) {
      peer.connection.close();
      peerConnections.current.delete(data.peerId);
    }
  }, []);

  useEffect(() => {
    if (!localStream) {
      return;
    }
    
    peerConnections.current.forEach(({ connection, peerId }) => {
      const senders = connection.getSenders();
      
      const audioTrack = localStream.getAudioTracks()[0];
      const videoTrack = localStream.getVideoTracks()[0];

      senders.forEach((sender) => {
        if (sender.track?.kind === 'audio' && audioTrack) {
          if (sender.track.id !== audioTrack.id) {
            sender.replaceTrack(audioTrack).catch((err) => {
              console.error('Failed to replace audio track:', err);
            });
          }
        } else if (sender.track?.kind === 'video' && videoTrack) {
          if (sender.track.id !== videoTrack.id) {
            sender.replaceTrack(videoTrack).catch((err) => {
              console.error('Failed to replace video track:', err);
            });
          }
        } else if (sender.track?.kind === 'video' && !videoTrack) {
          sender.replaceTrack(null).catch((err) => {
            console.error('Failed to remove video track:', err);
          });
        }
      });
    });

    console.log('✅ All peer connections updated');
  }, [localStream]);

  // Setup WebRTC socket listeners
  useEffect(() => {
    if (!webrtcSocket || !roomId) return;

    webrtcSocket.emit(WEBSOCKET_EVENTS.JOIN_ROOM, { roomId });

    webrtcSocket.on(WEBSOCKET_EVENTS.OFFER, handleOffer);
    webrtcSocket.on(WEBSOCKET_EVENTS.ANSWER, handleAnswer);
    webrtcSocket.on(WEBSOCKET_EVENTS.ICE_CANDIDATE, handleIceCandidate);
    webrtcSocket.on(WEBSOCKET_EVENTS.NEW_PARTICIPANT, handleNewParticipant);
    webrtcSocket.on(WEBSOCKET_EVENTS.EXISTING_PARTICIPANTS, handleExistingParticipants);
    webrtcSocket.on(WEBSOCKET_EVENTS.PARTICIPANT_LEFT, handleParticipantLeft);

    return () => {
      webrtcSocket.off(WEBSOCKET_EVENTS.OFFER, handleOffer);
      webrtcSocket.off(WEBSOCKET_EVENTS.ANSWER, handleAnswer);
      webrtcSocket.off(WEBSOCKET_EVENTS.ICE_CANDIDATE, handleIceCandidate);
      webrtcSocket.off(WEBSOCKET_EVENTS.NEW_PARTICIPANT, handleNewParticipant);
      webrtcSocket.off(WEBSOCKET_EVENTS.EXISTING_PARTICIPANTS, handleExistingParticipants);
      webrtcSocket.off(WEBSOCKET_EVENTS.PARTICIPANT_LEFT, handleParticipantLeft);

      // Close all peer connections
      peerConnections.current.forEach(({ connection }) => {
        connection.close();
      });
      peerConnections.current.clear();
    };
  }, [
    webrtcSocket,
    roomId,
    handleOffer,
    handleAnswer,
    handleIceCandidate,
    handleNewParticipant,
    handleExistingParticipants,
    handleParticipantLeft,
  ]);

  return {
    peerConnections: peerConnections.current,
  };
};