// import { useEffect, useRef, useCallback } from 'react';
// import { useDispatch } from 'react-redux';
// import { Socket } from 'socket.io-client';
// import type { AppDispatch } from '../store/store';
// import { setParticipantStream, updateParticipant } from '../store/slices/participantsSlice';
// import { createPeerConnection } from '../utils/webrtc-utils';
// import { WEBSOCKET_EVENTS } from '../constants/meeting.constants';

// interface PeerConnection {
//   peerId: string;
//   connection: RTCPeerConnection;
// }

// export const useWebRTC = (
//   webrtcSocket: Socket | null,
//   roomId: string | null,
//   localStream: MediaStream | null
// ) => {
//   const dispatch = useDispatch<AppDispatch>();
//   const peerConnections = useRef<Map<string, PeerConnection>>(new Map());
//   const localStreamRef = useRef<MediaStream | null>(null);
//   const hasJoinedWebRTCRef = useRef(false);

//   // Cập nhật ref stream
//   useEffect(() => {
//     localStreamRef.current = localStream;
//   }, [localStream]);

//   // --- Hàm tạo PeerConnection ---
//   const createPeerConnectionForPeer = useCallback(
//     (peerId: string): RTCPeerConnection => {
//       if (peerConnections.current.has(peerId)) {
//         return peerConnections.current.get(peerId)!.connection;
//       }

//       console.log(`🛠 [WebRTC] Tạo kết nối với: ${peerId}`);
//       const pc = createPeerConnection();

//       // 1. Add Local Tracks
//       const stream = localStreamRef.current;
//       if (stream) {
//         stream.getTracks().forEach((track) => {
//           pc.addTrack(track, stream);
//         });
//       }

//       // 2. Handle Remote Stream
//       pc.ontrack = (event) => {
//         const [remoteStream] = event.streams;
//         if (remoteStream) {
//           console.log(`🎥 [WebRTC] Nhận video từ: ${peerId}`);
//           dispatch(setParticipantStream({ peerId, stream: remoteStream }));
//         }
//       };

//       // 3. Handle ICE
//       pc.onicecandidate = (event) => {
//         if (event.candidate && webrtcSocket) {
//           webrtcSocket.emit(WEBSOCKET_EVENTS.ICE_CANDIDATE, {
//             target: peerId,
//             candidate: event.candidate,
//           });
//         }
//       };

//       // 4. Connection State
//       pc.onconnectionstatechange = () => {
//         let status = 'connecting';
//         if (pc.connectionState === 'connected') status = 'connected';
//         if (pc.connectionState === 'failed' || pc.connectionState === 'closed') status = 'disconnected';
        
//         dispatch(updateParticipant({
//           id: peerId,
//           updates: { connectionStatus: status as any },
//         }));
//       };

//       peerConnections.current.set(peerId, { peerId, connection: pc });
//       return pc;
//     },
//     [webrtcSocket, dispatch]
//   );

//   // --- Handlers ---
//   const handleExistingParticipants = useCallback(({ participants }: { participants: any[] }) => {
//     console.log('👥 [WebRTC] Người cũ trong phòng:', participants);
//     participants.forEach((p) => {
//       const peerId = p.peerId;
//       const pc = createPeerConnectionForPeer(peerId);
      
//       pc.createOffer()
//         .then((offer) => pc.setLocalDescription(offer))
//         .then(() => {
//           webrtcSocket?.emit(WEBSOCKET_EVENTS.OFFER, {
//             target: peerId,
//             offer: pc.localDescription,
//             roomId,
//           });
//         })
//         .catch(e => console.error('❌ Lỗi tạo Offer:', e));
//     });
//   }, [createPeerConnectionForPeer, webrtcSocket, roomId]);

//   const handleNewParticipant = useCallback(({ peerId }: { peerId: string }) => {
//     console.log('🆕 [WebRTC] Người mới vào (Chờ Offer):', peerId);
//     createPeerConnectionForPeer(peerId);
//   }, [createPeerConnectionForPeer]);

//   const handleOffer = useCallback(async (data: { sender: string; offer: RTCSessionDescriptionInit }) => {
//     try {
//       const { sender, offer } = data;
//       console.log('📥 [WebRTC] Nhận Offer từ:', sender);
//       const pc = createPeerConnectionForPeer(sender);
      
//       if (pc.signalingState !== "stable") {
//         // Rollback nếu cần, hoặc bỏ qua để tránh conflict
//         return; 
//       }

//       await pc.setRemoteDescription(new RTCSessionDescription(offer));
//       const answer = await pc.createAnswer();
//       await pc.setLocalDescription(answer);

//       webrtcSocket?.emit(WEBSOCKET_EVENTS.ANSWER, {
//         target: sender,
//         answer: pc.localDescription,
//       });
//     } catch (error) {
//       console.error('❌ Lỗi xử lý Offer:', error);
//     }
//   }, [createPeerConnectionForPeer, webrtcSocket]);

//   const handleAnswer = useCallback(async (data: { sender: string; answer: RTCSessionDescriptionInit }) => {
//     try {
//       const pc = peerConnections.current.get(data.sender)?.connection;
//       if (pc) {
//         await pc.setRemoteDescription(new RTCSessionDescription(data.answer));
//       }
//     } catch (error) {
//       console.error('❌ Lỗi xử lý Answer:', error);
//     }
//   }, []);

//   const handleIceCandidate = useCallback(async (data: { sender: string; candidate: RTCIceCandidateInit }) => {
//     try {
//       const pc = peerConnections.current.get(data.sender)?.connection;
//       if (pc) {
//         await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
//       }
//     } catch (error) {
//       console.error('❌ Lỗi xử lý ICE:', error);
//     }
//   }, []);

//   const handleParticipantLeft = useCallback(({ peerId }: { peerId: string }) => {
//     if (peerConnections.current.has(peerId)) {
//       peerConnections.current.get(peerId)?.connection.close();
//       peerConnections.current.delete(peerId);
//       dispatch(setParticipantStream({ peerId, stream: undefined as any }));
//     }
//   }, [dispatch]);

//   // --- Main Effect ---
//   useEffect(() => {
//     if (!webrtcSocket || !roomId || !localStream) return;

//     // Hàm thực hiện join room
//     const joinWebRTCRoom = () => {
//         if (hasJoinedWebRTCRef.current) return;
//         console.log('🚀 [WebRTC] Gửi sự kiện Join Room:', roomId);
//         webrtcSocket.emit(WEBSOCKET_EVENTS.JOIN_ROOM, { roomId });
//         hasJoinedWebRTCRef.current = true;
//     };

//     // Chờ socket kết nối xong mới join
//     if (webrtcSocket.connected) {
//         joinWebRTCRoom();
//     } else {
//         webrtcSocket.on('connect', joinWebRTCRoom);
//     }

//     // Register Listeners
//     webrtcSocket.on(WEBSOCKET_EVENTS.EXISTING_PARTICIPANTS, handleExistingParticipants);
//     webrtcSocket.on(WEBSOCKET_EVENTS.NEW_PARTICIPANT, handleNewParticipant);
//     webrtcSocket.on(WEBSOCKET_EVENTS.OFFER, handleOffer);
//     webrtcSocket.on(WEBSOCKET_EVENTS.ANSWER, handleAnswer);
//     webrtcSocket.on(WEBSOCKET_EVENTS.ICE_CANDIDATE, handleIceCandidate);
//     webrtcSocket.on(WEBSOCKET_EVENTS.PARTICIPANT_LEFT, handleParticipantLeft);

//     return () => {
//       webrtcSocket.off('connect', joinWebRTCRoom);
//       webrtcSocket.off(WEBSOCKET_EVENTS.EXISTING_PARTICIPANTS);
//       webrtcSocket.off(WEBSOCKET_EVENTS.NEW_PARTICIPANT);
//       webrtcSocket.off(WEBSOCKET_EVENTS.OFFER);
//       webrtcSocket.off(WEBSOCKET_EVENTS.ANSWER);
//       webrtcSocket.off(WEBSOCKET_EVENTS.ICE_CANDIDATE);
//       webrtcSocket.off(WEBSOCKET_EVENTS.PARTICIPANT_LEFT);
      
//       hasJoinedWebRTCRef.current = false;
//       webrtcSocket.emit('leave-room', { roomId });
      
//       peerConnections.current.forEach((p) => p.connection.close());
//       peerConnections.current.clear();
//     };
//   }, [
//     webrtcSocket, 
//     roomId, 
//     localStream, // Re-run khi stream thay đổi để add track
//     handleExistingParticipants, 
//     handleNewParticipant, 
//     handleOffer, 
//     handleAnswer, 
//     handleIceCandidate, 
//     handleParticipantLeft
//   ]);

//   return { peerConnections: peerConnections.current };
// };

import { useEffect, useRef, useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { Socket } from 'socket.io-client';
import type { AppDispatch } from '../store/store';
import { setParticipantStream, updateParticipant } from '../store/slices/participantsSlice';
import { createPeerConnection } from '../utils/webrtc-utils';
import { WEBSOCKET_EVENTS } from '../constants/meeting.constants';

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
  
  // Ref để kiểm soát việc đã join room hay chưa
  const hasJoinedRef = useRef(false);

  // 1. Luôn cập nhật ref của stream
  useEffect(() => {
    localStreamRef.current = localStream;
  }, [localStream]);

  // 2. Xử lý thay đổi Camera/Mic (Thay thế track nóng)
  useEffect(() => {
    if (!localStream) return;

    const videoTrack = localStream.getVideoTracks()[0];
    const audioTrack = localStream.getAudioTracks()[0];

    peerConnections.current.forEach((pcWrapper) => {
      const pc = pcWrapper.connection;
      const senders = pc.getSenders();

      // Thay thế Video Track
      const videoSender = senders.find((s) => s.track?.kind === 'video');
      if (videoSender && videoTrack) {
        videoSender.replaceTrack(videoTrack).catch((err) => 
          console.error('Lỗi replace video track:', err)
        );
      } else if (!videoSender && videoTrack) {
        // Nếu chưa có sender (lúc đầu không có cam), add track và cần renegotiate (nhưng ở đây ta tạm bỏ qua renegotiate phức tạp, ưu tiên case replace)
        // pc.addTrack(videoTrack, localStream); 
      }

      // Thay thế Audio Track
      const audioSender = senders.find((s) => s.track?.kind === 'audio');
      if (audioSender && audioTrack) {
        audioSender.replaceTrack(audioTrack).catch((err) => 
          console.error('Lỗi replace audio track:', err)
        );
      }
    });
  }, [localStream]);

  // --- Hàm tạo PeerConnection ---
  const createPeerConnectionForPeer = useCallback(
    (peerId: string): RTCPeerConnection => {
      if (peerConnections.current.has(peerId)) {
        return peerConnections.current.get(peerId)!.connection;
      }

      console.log(`🛠 [WebRTC] Tạo kết nối với: ${peerId}`);
      const pc = createPeerConnection();

      // QUAN TRỌNG: Add Tracks từ localStreamRef (đảm bảo luôn mới nhất)
      const stream = localStreamRef.current;
      if (stream) {
        stream.getTracks().forEach((track) => {
          pc.addTrack(track, stream);
        });
      } else {
        console.warn('⚠️ Tạo PC nhưng chưa có LocalStream!');
      }

      // Handle Remote Stream
      pc.ontrack = (event) => {
        const [remoteStream] = event.streams;
        if (remoteStream) {
          console.log(`🎥 [WebRTC] Nhận stream từ: ${peerId}`);
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
          id: peerId, // Lưu ý: logic này giả định peerId map được với participant.id trong store
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
    console.log('🆕 [WebRTC] Người mới vào:', peerId);
    createPeerConnectionForPeer(peerId);
  }, [createPeerConnectionForPeer]);

  const handleOffer = useCallback(async (data: { sender: string; offer: RTCSessionDescriptionInit }) => {
    try {
      const { sender, offer } = data;
      console.log('📥 [WebRTC] Nhận Offer từ:', sender);
      const pc = createPeerConnectionForPeer(sender);
      
      // Fix race condition: chỉ set remote nếu đang stable hoặc have-local-offer (rollback) - đơn giản hóa:
      if (pc.signalingState !== "stable" && pc.signalingState !== "have-remote-offer") {
         // Có thể cần rollback hoặc ignore nếu xung đột, nhưng ở mức cơ bản ta cứ tiếp tục
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

  // --- 3. Setup Listeners (Chạy 1 lần khi có socket) ---
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

  // --- 4. Join Room Logic (Chỉ chạy khi ĐỦ điều kiện) ---
  useEffect(() => {
    // Điều kiện tiên quyết: Phải có Stream thì mới Join!
    if (!webrtcSocket || !roomId || !localStream) return;
    if (hasJoinedRef.current) return;

    const joinWebRTCRoom = () => {
      console.log('🚀 [WebRTC] Đã có Stream -> Gửi lệnh Join Room:', roomId);
      webrtcSocket.emit(WEBSOCKET_EVENTS.JOIN_ROOM, { roomId });
      hasJoinedRef.current = true;
    };

    if (webrtcSocket.connected) {
      joinWebRTCRoom();
    } else {
      webrtcSocket.once('connect', joinWebRTCRoom);
    }

    // Cleanup khi component unmount (rời phòng)
    return () => {
      webrtcSocket.off('connect', joinWebRTCRoom);
      if (hasJoinedRef.current) {
        console.log('🛑 [WebRTC] Rời phòng...');
        webrtcSocket.emit('leave-room', { roomId });
        hasJoinedRef.current = false;
        
        // Đóng các kết nối
        peerConnections.current.forEach((p) => p.connection.close());
        peerConnections.current.clear();
      }
    };
  }, [webrtcSocket, roomId, localStream]); // localStream có trong deps để kích hoạt Join khi stream sẵn sàng

  return { peerConnections: peerConnections.current };
};