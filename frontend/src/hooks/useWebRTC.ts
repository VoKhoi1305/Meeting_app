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

//   useEffect(() => {
//     localStreamRef.current = localStream;
//   }, [localStream]);

//   const createPeerConnectionForPeer = useCallback(
//     (peerId: string): RTCPeerConnection => {
    
//       if (peerConnections.current.has(peerId)) {
//         return peerConnections.current.get(peerId)!.connection;
//       }

//       const pc = createPeerConnection();

//       // Thêm track từ stream hiện tại vào kết nối
//       const stream = localStreamRef.current;
//       if (stream) {
//         stream.getTracks().forEach((track) => {
//           pc.addTrack(track, stream);
//         });
//       }

//       pc.ontrack = (event) => {
//         const [remoteStream] = event.streams;
//         if (remoteStream) {
//           console.log(`🎥 Nhận được video từ: ${peerId}`);
//           dispatch(setParticipantStream({ peerId, stream: remoteStream }));
//         }
//       };

//       pc.onicecandidate = (event) => {
//         if (event.candidate && webrtcSocket) {
//           webrtcSocket.emit(WEBSOCKET_EVENTS.ICE_CANDIDATE, {
//             target: peerId,
//             candidate: event.candidate,
//           });
//         }
//       };

//       // Theo dõi trạng thái kết nối
//       pc.onconnectionstatechange = () => {
//         console.log(`🔌 Trạng thái kết nối ${peerId}:`, pc.connectionState);
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

//   // --- Xử lý tín hiệu WebRTC ---

//   const handleNewParticipant = useCallback(({ peerId }: { peerId: string }) => {
//     console.log('🆕 Người mới vào, bắt đầu kết nối với:', peerId);
//     const pc = createPeerConnectionForPeer(peerId);
//     pc.createOffer()
//       .then((offer) => pc.setLocalDescription(offer))
//       .then(() => {
//         webrtcSocket?.emit(WEBSOCKET_EVENTS.OFFER, {
//           target: peerId,
//           offer: pc.localDescription,
//           roomId,
//         });
//       })
//       .catch((e) => console.error('Lỗi tạo Offer:', e));
//   }, [createPeerConnectionForPeer, roomId, webrtcSocket]);

//   const handleOffer = useCallback(async (data: { sender: string; offer: RTCSessionDescriptionInit }) => {
//     try {
//       const { sender, offer } = data;
//       console.log('📥 Nhận yêu cầu kết nối từ:', sender);
      
//       // Khi nhận yêu cầu mới, reset kết nối cũ nếu có để tránh lỗi
//       if (peerConnections.current.has(sender)) {
//         peerConnections.current.get(sender)?.connection.close();
//         peerConnections.current.delete(sender);
//       }
      
//       const pc = createPeerConnectionForPeer(sender);
//       await pc.setRemoteDescription(new RTCSessionDescription(offer));
      
//       const answer = await pc.createAnswer();
//       await pc.setLocalDescription(answer);

//       webrtcSocket?.emit(WEBSOCKET_EVENTS.ANSWER, {
//         target: sender,
//         answer: pc.localDescription,
//       });
//     } catch (error) {
//       console.error('Lỗi xử lý Offer:', error);
//     }
//   }, [createPeerConnectionForPeer, webrtcSocket]);

//   const handleAnswer = useCallback(async (data: { sender: string; answer: RTCSessionDescriptionInit }) => {
//     try {
//       const pc = peerConnections.current.get(data.sender)?.connection;
//       if (pc) {
//         console.log('✅ Đã nhận chấp nhận kết nối từ:', data.sender);
//         await pc.setRemoteDescription(new RTCSessionDescription(data.answer));
//       }
//     } catch (error) {
//       console.error('Lỗi xử lý Answer:', error);
//     }
//   }, []);

//   const handleIceCandidate = useCallback(async (data: { sender: string; candidate: RTCIceCandidateInit }) => {
//     try {
//       const pc = peerConnections.current.get(data.sender)?.connection;
//       if (pc) {
//         await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
//       }
//     } catch (error) {
//       console.error('Lỗi xử lý ICE:', error);
//     }
//   }, []);

//   const handleParticipantLeft = useCallback(({ peerId }: { peerId: string }) => {
//     if (peerConnections.current.has(peerId)) {
//       peerConnections.current.get(peerId)?.connection.close();
//       peerConnections.current.delete(peerId);
//       dispatch(setParticipantStream({ peerId, stream: undefined as any }));
//     }
//   }, [dispatch]);

//   useEffect(() => {
//     if (!webrtcSocket || !roomId) return;

//     webrtcSocket.emit(WEBSOCKET_EVENTS.JOIN_ROOM, { roomId });

//     webrtcSocket.on(WEBSOCKET_EVENTS.NEW_PARTICIPANT, handleNewParticipant);
//     webrtcSocket.on(WEBSOCKET_EVENTS.OFFER, handleOffer);
//     webrtcSocket.on(WEBSOCKET_EVENTS.ANSWER, handleAnswer);
//     webrtcSocket.on(WEBSOCKET_EVENTS.ICE_CANDIDATE, handleIceCandidate);
//     webrtcSocket.on(WEBSOCKET_EVENTS.PARTICIPANT_LEFT, handleParticipantLeft);
    
//     webrtcSocket.on(WEBSOCKET_EVENTS.EXISTING_PARTICIPANTS, ({ participants }) => {
//       participants.forEach((p: any) => handleNewParticipant({ peerId: p.peerId }));
//     });

//     return () => {
//       webrtcSocket.off(WEBSOCKET_EVENTS.NEW_PARTICIPANT);
//       webrtcSocket.off(WEBSOCKET_EVENTS.OFFER);
//       webrtcSocket.off(WEBSOCKET_EVENTS.ANSWER);
//       webrtcSocket.off(WEBSOCKET_EVENTS.ICE_CANDIDATE);
//       webrtcSocket.off(WEBSOCKET_EVENTS.PARTICIPANT_LEFT);
//       webrtcSocket.off(WEBSOCKET_EVENTS.EXISTING_PARTICIPANTS);
      
//       peerConnections.current.forEach((p) => p.connection.close());
//       peerConnections.current.clear();
//     };
//   }, [webrtcSocket, roomId, handleNewParticipant, handleOffer, handleAnswer, handleIceCandidate, handleParticipantLeft]);

//   useEffect(() => {
//     if (!localStream) return;

//     peerConnections.current.forEach(({ connection }) => {
//       const senders = connection.getSenders();
//       const audioTrack = localStream.getAudioTracks()[0];
//       const videoTrack = localStream.getVideoTracks()[0];

//       if (senders.length === 0) {
//         localStream.getTracks().forEach((track) => connection.addTrack(track, localStream));
//         return;
//       }

//       senders.forEach((sender) => {
//         if (sender.track?.kind === 'audio' && audioTrack) {
//           sender.replaceTrack(audioTrack).catch(console.error);
//         }
//         if (sender.track?.kind === 'video' && videoTrack) {
//           sender.replaceTrack(videoTrack).catch(console.error);
//         }
//       });
//     });
//   }, [localStream]);

//   return { peerConnections: peerConnections.current };
// };

// import type { AppDispatch } from '../store/store';

// import { setParticipantStream, updateParticipant } from '../store/slices/participantsSlice';

// import { createPeerConnection } from '../utils/webrtc-utils';

// import { WEBSOCKET_EVENTS } from '../constants/meeting.constants';



// interface PeerConnectionWrapper {

//   peerId: string;

//   connection: RTCPeerConnection;

//   makingOffer: boolean;

// }



// export const useWebRTC = (

//   webrtcSocket: Socket | null,

//   roomId: string | null,

//   localStream: MediaStream | null

// ) => {

//   const dispatch = useDispatch<AppDispatch>();

//   const peerConnections = useRef<Map<string, PeerConnectionWrapper>>(new Map());

//   const localStreamRef = useRef<MediaStream | null>(null);



//   useEffect(() => {

//     localStreamRef.current = localStream;

//   }, [localStream]);



//   const createPeer = useCallback((peerId: string, isInitiator: boolean) => {

//     if (peerConnections.current.has(peerId)) {

//       return peerConnections.current.get(peerId)!.connection;

//     }



//     const pc = createPeerConnection();

//     const wrapper: PeerConnectionWrapper = {

//       peerId,

//       connection: pc,

//       makingOffer: false

//     };



//     // Add local tracks if available

//     if (localStreamRef.current) {

//       localStreamRef.current.getTracks().forEach((track) => {

//         pc.addTrack(track, localStreamRef.current!);

//       });

//     }



//     pc.onicecandidate = (event) => {

//       if (event.candidate && webrtcSocket) {

//         webrtcSocket.emit(WEBSOCKET_EVENTS.ICE_CANDIDATE, {

//           target: peerId,

//           candidate: event.candidate,

//         });

//       }

//     };



//     pc.ontrack = (event) => {

//       const [remoteStream] = event.streams;

//       if (remoteStream) {

//         console.log(`Received remote stream from ${peerId}`, remoteStream);

//         dispatch(setParticipantStream({ peerId, stream: remoteStream }));

//       }

//     };



//     pc.onconnectionstatechange = () => {

//       console.log(`Connection state for ${peerId}:`, pc.connectionState);

//       let status = 'connecting';

//       if (pc.connectionState === 'connected') status = 'connected';

//       if (pc.connectionState === 'failed' || pc.connectionState === 'closed') status = 'disconnected';

      

//       dispatch(updateParticipant({

//         id: peerId, 

//         updates: { connectionStatus: status as any },

//       }));

//     };



//     // Handle negotiation with Perfect Negotiation pattern

//     pc.onnegotiationneeded = async () => {

//       try {

//         wrapper.makingOffer = true;

//         await pc.setLocalDescription();

        

//         if (webrtcSocket && pc.localDescription) {

//           webrtcSocket.emit(WEBSOCKET_EVENTS.OFFER, {

//             target: peerId,

//             offer: pc.localDescription,

//             roomId,

//           });

//         }

//       } catch (err) {

//         console.error(`Negotiation error for ${peerId}:`, err);

//       } finally {

//         wrapper.makingOffer = false;

//       }

//     };



//     peerConnections.current.set(peerId, wrapper);

//     return pc;

//   }, [webrtcSocket, dispatch, roomId]);



//   // Sync Tracks when localStream changes

//   useEffect(() => {

//     if (!localStream) return;

    

//     const videoTrack = localStream.getVideoTracks()[0];

//     const audioTrack = localStream.getAudioTracks()[0];



//     peerConnections.current.forEach(({ connection }) => {

//       const senders = connection.getSenders();

      

//       // Handle video track

//       const videoSender = senders.find(s => s.track?.kind === 'video');

//       if (videoTrack) {

//         if (videoSender) {

//           videoSender.replaceTrack(videoTrack).catch(console.error);

//         } else {

//           connection.addTrack(videoTrack, localStream);

//         }

//       }



//       // Handle audio track

//       const audioSender = senders.find(s => s.track?.kind === 'audio');

//       if (audioTrack) {

//         if (audioSender) {

//           audioSender.replaceTrack(audioTrack).catch(console.error);

//         } else {

//           connection.addTrack(audioTrack, localStream);

//         }

//       }

//     });

//   }, [localStream]);



//   // Socket Events

//   useEffect(() => {

//     if (!webrtcSocket || !roomId) return;



//     const handleNewParticipant = async ({ peerId }: { peerId: string }) => {

//       console.log(`New participant joined: ${peerId}`);

//       createPeer(peerId, true);

//     };



//     const handleOffer = async ({ sender, offer }: any) => {

//       try {

//         const wrapper = peerConnections.current.get(sender);

//         const pc = wrapper ? wrapper.connection : createPeer(sender, false);

        

//         // Perfect Negotiation Pattern - handle offer collision

//         const offerCollision = 

//           offer.type === 'offer' && 

//           (wrapper?.makingOffer || pc.signalingState !== 'stable');



//         const polite = sender > webrtcSocket.id!; // Deterministic politeness

        

//         if (offerCollision && !polite) {

//           console.log(`Ignoring offer collision from ${sender}`);

//           return;

//         }



//         await pc.setRemoteDescription(new RTCSessionDescription(offer));

        

//         if (offer.type === 'offer') {

//           await pc.setLocalDescription();

//           webrtcSocket.emit(WEBSOCKET_EVENTS.ANSWER, { 

//             target: sender, 

//             answer: pc.localDescription 

//           });

//         }

//       } catch (e) { 

//         console.error('Error handling offer:', e); 

//       }

//     };



//     const handleAnswer = async ({ sender, answer }: any) => {

//       try {

//         const pc = peerConnections.current.get(sender)?.connection;

//         if (pc && pc.signalingState !== 'stable') {

//           await pc.setRemoteDescription(new RTCSessionDescription(answer));

//         }

//       } catch (e) { 

//         console.error('Error handling answer:', e); 

//       }

//     };



//     const handleIce = async ({ sender, candidate }: any) => {

//       try {

//         const pc = peerConnections.current.get(sender)?.connection;

//         if (pc && candidate) {

//           await pc.addIceCandidate(new RTCIceCandidate(candidate));

//         }

//       } catch (e) { 

//         console.error('Error handling ICE candidate:', e); 

//       }

//     };



//     const handleParticipantLeft = ({ peerId }: { peerId: string }) => {

//       const wrapper = peerConnections.current.get(peerId);

//       if (wrapper) {

//         wrapper.connection.close();

//         peerConnections.current.delete(peerId);

//       }

//     };



//     webrtcSocket.on('existing-participants', ({ participants }) => {

//       console.log('Existing participants:', participants);

//       participants.forEach((p: any) => handleNewParticipant({ peerId: p.peerId }));

//     });

    

//     webrtcSocket.on('new-participant', handleNewParticipant);

//     webrtcSocket.on('participant-left', handleParticipantLeft);

//     webrtcSocket.on(WEBSOCKET_EVENTS.OFFER, handleOffer);

//     webrtcSocket.on(WEBSOCKET_EVENTS.ANSWER, handleAnswer);

//     webrtcSocket.on(WEBSOCKET_EVENTS.ICE_CANDIDATE, handleIce);

    

//     webrtcSocket.emit(WEBSOCKET_EVENTS.JOIN_ROOM, { roomId });



//     return () => {

//       webrtcSocket.off('existing-participants');

//       webrtcSocket.off('new-participant');

//       webrtcSocket.off('participant-left');

//       webrtcSocket.off(WEBSOCKET_EVENTS.OFFER);

//       webrtcSocket.off(WEBSOCKET_EVENTS.ANSWER);

//       webrtcSocket.off(WEBSOCKET_EVENTS.ICE_CANDIDATE);

      

//       peerConnections.current.forEach((wrapper) => {

//         wrapper.connection.close();

//       });

//       peerConnections.current.clear();

//     };

//   }, [webrtcSocket, roomId, createPeer]);



//   return { peers: peerConnections.current };

// };


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

  // Luôn cập nhật ref của stream để dùng trong callback
  useEffect(() => {
    localStreamRef.current = localStream;
  }, [localStream]);

  // --- Hàm tạo PeerConnection chung ---
  const createPeerConnectionForPeer = useCallback(
    (peerId: string): RTCPeerConnection => {
      if (peerConnections.current.has(peerId)) {
        return peerConnections.current.get(peerId)!.connection;
      }

      console.log(`🛠 [WebRTC] Khởi tạo kết nối với: ${peerId}`);
      const pc = createPeerConnection();

      // 1. Thêm track từ Local Stream (nếu có) vào kết nối
      const stream = localStreamRef.current;
      if (stream) {
        stream.getTracks().forEach((track) => {
          pc.addTrack(track, stream);
        });
      } else {
        console.warn(`⚠️ [WebRTC] Cảnh báo: Chưa có LocalStream khi kết nối với ${peerId}`);
      }

      // 2. Khi nhận được Stream từ đối phương
      pc.ontrack = (event) => {
        const [remoteStream] = event.streams;
        if (remoteStream) {
          console.log(`🎥 [WebRTC] Nhận được video từ: ${peerId}`);
          dispatch(setParticipantStream({ peerId, stream: remoteStream }));
        }
      };

      // 3. Xử lý ICE Candidate
      pc.onicecandidate = (event) => {
        if (event.candidate && webrtcSocket) {
          webrtcSocket.emit(WEBSOCKET_EVENTS.ICE_CANDIDATE, {
            target: peerId,
            candidate: event.candidate,
          });
        }
      };

      // 4. Theo dõi trạng thái
      pc.onconnectionstatechange = () => {
        console.log(`zwj [WebRTC] Trạng thái ${peerId}:`, pc.connectionState);
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

  // --- CÁC HANDLER SỰ KIỆN ---

  // A. Người MỚI vào phòng (Nhận danh sách người cũ) -> CHỦ ĐỘNG GỌI (OFFER)
  const handleExistingParticipants = useCallback(({ participants }: { participants: any[] }) => {
    console.log('👥 [WebRTC] Tìm thấy người cũ trong phòng:', participants);
    participants.forEach((p) => {
      const peerId = p.peerId;
      const pc = createPeerConnectionForPeer(peerId);
      
      // Tạo Offer
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

  // B. Người CŨ trong phòng (Thấy người mới vào) -> CHỈ TẠO PC, CHỜ OFFER
  const handleNewParticipant = useCallback(({ peerId }: { peerId: string }) => {
    console.log('🆕 [WebRTC] Người mới vào (Mình sẽ chờ Offer):', peerId);
    createPeerConnectionForPeer(peerId);
  }, [createPeerConnectionForPeer]);

  // C. Xử lý khi nhận OFFER
  const handleOffer = useCallback(async (data: { sender: string; offer: RTCSessionDescriptionInit }) => {
    try {
      const { sender, offer } = data;
      console.log('📥 [WebRTC] Nhận Offer từ:', sender);
      
      const pc = createPeerConnectionForPeer(sender);
      
      // Fix lỗi "Have local offer" nếu lỡ tay tạo offer
      if (pc.signalingState !== "stable") {
        console.warn("⚠️ Signaling state không ổn định, bỏ qua hoặc rollback...");
        // Tùy chọn: await Promise.all([pc.setLocalDescription({type: "rollback"}), pc.setRemoteDescription(offer)]);
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

  // D. Xử lý khi nhận ANSWER
  const handleAnswer = useCallback(async (data: { sender: string; answer: RTCSessionDescriptionInit }) => {
    try {
      console.log('✅ [WebRTC] Nhận Answer từ:', data.sender);
      const pc = peerConnections.current.get(data.sender)?.connection;
      if (pc) {
        await pc.setRemoteDescription(new RTCSessionDescription(data.answer));
      }
    } catch (error) {
      console.error('❌ Lỗi xử lý Answer:', error);
    }
  }, []);

  // E. Xử lý ICE Candidate
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

  // --- SETUP SOCKET LISTENERS ---
  useEffect(() => {
    // Chỉ chạy khi đã có đủ thông tin
    if (!webrtcSocket || !roomId || !localStream) return;

    console.log('🚀 [WebRTC] Join room socket:', roomId);
    webrtcSocket.emit(WEBSOCKET_EVENTS.JOIN_ROOM, { roomId });

    webrtcSocket.on(WEBSOCKET_EVENTS.EXISTING_PARTICIPANTS, handleExistingParticipants);
    webrtcSocket.on(WEBSOCKET_EVENTS.NEW_PARTICIPANT, handleNewParticipant);
    webrtcSocket.on(WEBSOCKET_EVENTS.OFFER, handleOffer);
    webrtcSocket.on(WEBSOCKET_EVENTS.ANSWER, handleAnswer);
    webrtcSocket.on(WEBSOCKET_EVENTS.ICE_CANDIDATE, handleIceCandidate);
    webrtcSocket.on(WEBSOCKET_EVENTS.PARTICIPANT_LEFT, handleParticipantLeft);

    return () => {
      // Cleanup
      webrtcSocket.off(WEBSOCKET_EVENTS.EXISTING_PARTICIPANTS);
      webrtcSocket.off(WEBSOCKET_EVENTS.NEW_PARTICIPANT);
      webrtcSocket.off(WEBSOCKET_EVENTS.OFFER);
      webrtcSocket.off(WEBSOCKET_EVENTS.ANSWER);
      webrtcSocket.off(WEBSOCKET_EVENTS.ICE_CANDIDATE);
      webrtcSocket.off(WEBSOCKET_EVENTS.PARTICIPANT_LEFT);
      
      webrtcSocket.emit('leave-room', { roomId });
      peerConnections.current.forEach((p) => p.connection.close());
      peerConnections.current.clear();
    };
  }, [
    webrtcSocket, 
    roomId, 
    localStream, // Quan trọng: Re-run khi localStream thay đổi
    handleExistingParticipants, 
    handleNewParticipant, 
    handleOffer, 
    handleAnswer, 
    handleIceCandidate, 
    handleParticipantLeft
  ]);

  return { peerConnections: peerConnections.current };
};