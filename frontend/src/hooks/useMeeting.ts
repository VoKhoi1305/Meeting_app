// import { useEffect, useCallback, useRef } from 'react';
// import { useDispatch, useSelector } from 'react-redux';
// import { useNavigate } from 'react-router-dom';
// import type { AppDispatch, RootState } from '../store/store';
// import {
//   setParticipants,
//   addParticipant,
//   removeParticipant,
//   updateParticipant,
//   setLocalParticipant,
//   clearParticipants,
// } from '../store/slices/participantsSlice';
// import { clearMeeting } from '../store/slices/meetingSlice';
// import { WEBSOCKET_EVENTS } from '../constants/meeting.constants';
// import websocketService from '../services/websocket.service';
// import toast from 'react-hot-toast';

// export const useMeeting = (
//   roomId: string | null,
//   participantId: string | null
// ) => {
//   const dispatch = useDispatch<AppDispatch>();
//   const navigate = useNavigate();
//   const { isAudioEnabled, isVideoEnabled, isScreenSharing } = useSelector(
//     (state: RootState) => state.mediaDevices
//   );
  
//   const hasJoinedRef = useRef(false);

//   // --- 1. Join Room Logic ---
//   // Nhận webRTCPeerId để gửi kèm lên server
//   const joinRoom = useCallback((webRTCPeerId?: string) => {
//     const socket = websocketService.getMeetingsSocket();

//     if (!roomId || !participantId || !socket) {
//       return;
//     }

//     if (hasJoinedRef.current) return;

//     // Payload gửi lên server
//     const payload = { roomId, participantId, webRTCPeerId };

//     if (!socket.connected) {
//       console.log('⏳ Socket chưa sẵn sàng, chờ kết nối...');
//       const onConnect = () => {
//         console.log('✅ Socket đã kết nối! Đang tham gia phòng với PeerID:', webRTCPeerId);
//         socket.emit(WEBSOCKET_EVENTS.JOIN_ROOM, payload);
//         hasJoinedRef.current = true;
//         socket.off('connect', onConnect);
//       };
//       socket.on('connect', onConnect);
//       return;
//     }

//     console.log('🔌 Socket sẵn sàng. Tham gia phòng với PeerID:', webRTCPeerId);
//     socket.emit(WEBSOCKET_EVENTS.JOIN_ROOM, payload);
//     hasJoinedRef.current = true;
//   }, [roomId, participantId]);

//   // --- 2. Leave Room Logic ---
//   const leaveRoom = useCallback(() => {
//     const socket = websocketService.getMeetingsSocket();
//     if (socket && roomId) {
//       console.log('👋 Rời phòng:', roomId);
//       socket.emit(WEBSOCKET_EVENTS.LEAVE_ROOM, { roomId });
//       hasJoinedRef.current = false;
//       dispatch(clearParticipants());
//     }
//   }, [roomId, dispatch]);

//   // --- Actions ---
//   const toggleAudio = useCallback((enabled: boolean) => {
//     const socket = websocketService.getMeetingsSocket();
//     if (socket?.connected && roomId && participantId) {
//       socket.emit(WEBSOCKET_EVENTS.TOGGLE_AUDIO, { roomId, participantId, isEnabled: enabled });
//     }
//   }, [roomId, participantId]);

//   const toggleVideo = useCallback((enabled: boolean) => {
//     const socket = websocketService.getMeetingsSocket();
//     if (socket?.connected && roomId && participantId) {
//       socket.emit(WEBSOCKET_EVENTS.TOGGLE_VIDEO, { roomId, participantId, isEnabled: enabled });
//     }
//   }, [roomId, participantId]);

//   const startScreenShare = useCallback(() => {
//     const socket = websocketService.getMeetingsSocket();
//     if (socket?.connected && roomId && participantId) {
//       socket.emit(WEBSOCKET_EVENTS.START_SCREEN_SHARE, { roomId, participantId });
//     }
//   }, [roomId, participantId]);

//   const stopScreenShare = useCallback(() => {
//     const socket = websocketService.getMeetingsSocket();
//     if (socket?.connected && roomId && participantId) {
//       socket.emit(WEBSOCKET_EVENTS.STOP_SCREEN_SHARE, { roomId, participantId });
//     }
//   }, [roomId, participantId]);

//   // Sync state changes
//   useEffect(() => {
//     if (hasJoinedRef.current) toggleAudio(isAudioEnabled);
//   }, [isAudioEnabled, toggleAudio]);

//   useEffect(() => {
//     if (hasJoinedRef.current) toggleVideo(isVideoEnabled);
//   }, [isVideoEnabled, toggleVideo]);

//   useEffect(() => {
//     if (hasJoinedRef.current) {
//       isScreenSharing ? startScreenShare() : stopScreenShare();
//     }
//   }, [isScreenSharing, startScreenShare, stopScreenShare]);

//   // --- 3. Socket Listeners ---
//   useEffect(() => {
//     const socket = websocketService.getMeetingsSocket();
//     if (!socket) return;

//     const handleUserJoined = (data: { participant: any }) => {
//       console.log('➕ Người dùng mới:', data.participant.displayName);
//       dispatch(addParticipant(data.participant));
//       toast.success(`${data.participant.displayName} đã tham gia`);
//     };

//     const handleUserLeft = (data: { participantId: string }) => {
//       console.log('➖ Người dùng rời đi:', data.participantId);
//       dispatch(removeParticipant(data.participantId));
//     };

//     const handleParticipantUpdated = (data: { participantId: string; updates: any }) => {
//       dispatch(updateParticipant({ id: data.participantId, updates: data.updates }));
//     };

//     const handleParticipantsList = (data: { participants: any[] }) => {
//       console.log('📋 Danh sách người tham gia:', data.participants.length);
//       dispatch(setParticipants(data.participants));
      
//       if (participantId) {
//         const local = data.participants.find((p) => p.id === participantId);
//         if (local) dispatch(setLocalParticipant(local));
//       }
//     };

//     const handleMeetingEnded = () => {
//       toast.error('Cuộc họp đã kết thúc');
//       dispatch(clearParticipants());
//       dispatch(clearMeeting());
//       hasJoinedRef.current = false;
//       navigate('/dashboard');
//     };

//     socket.off(WEBSOCKET_EVENTS.USER_JOINED);
//     socket.off(WEBSOCKET_EVENTS.USER_LEFT);
//     socket.off(WEBSOCKET_EVENTS.PARTICIPANT_UPDATED);
//     socket.off(WEBSOCKET_EVENTS.PARTICIPANTS_LIST);
//     socket.off(WEBSOCKET_EVENTS.MEETING_ENDED);

//     socket.on(WEBSOCKET_EVENTS.USER_JOINED, handleUserJoined);
//     socket.on(WEBSOCKET_EVENTS.USER_LEFT, handleUserLeft);
//     socket.on(WEBSOCKET_EVENTS.PARTICIPANT_UPDATED, handleParticipantUpdated);
//     socket.on(WEBSOCKET_EVENTS.PARTICIPANTS_LIST, handleParticipantsList);
//     socket.on(WEBSOCKET_EVENTS.MEETING_ENDED, handleMeetingEnded);

//     return () => {
//       socket.off(WEBSOCKET_EVENTS.USER_JOINED);
//       socket.off(WEBSOCKET_EVENTS.USER_LEFT);
//       socket.off(WEBSOCKET_EVENTS.PARTICIPANT_UPDATED);
//       socket.off(WEBSOCKET_EVENTS.PARTICIPANTS_LIST);
//       socket.off(WEBSOCKET_EVENTS.MEETING_ENDED);
//     };
//   }, [dispatch, navigate, participantId]); 

//   useEffect(() => {
//     return () => {
//       hasJoinedRef.current = false;
//     };
//   }, []);

//   return { joinRoom, leaveRoom };
// };

import { useEffect, useCallback, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import type { AppDispatch, RootState } from '../store/store';
import {
  setParticipants,
  addParticipant,
  removeParticipant,
  updateParticipant,
  setLocalParticipant,
  clearParticipants,
} from '../store/slices/participantsSlice';
import { clearMeeting } from '../store/slices/meetingSlice';
import { WEBSOCKET_EVENTS } from '../constants/meeting.constants';
import websocketService from '../services/websocket.service';
import toast from 'react-hot-toast';

export const useMeeting = (
  roomId: string | null,
  participantId: string | null
) => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  
  // Lấy trạng thái Media của chính mình từ Redux
  const { isAudioEnabled, isVideoEnabled, isScreenSharing } = useSelector(
    (state: RootState) => state.mediaDevices
  );
  
  const hasJoinedRef = useRef(false);

  // --- 1. Join Room Logic ---
  const joinRoom = useCallback((webRTCPeerId?: string) => {
    const socket = websocketService.getMeetingsSocket();

    if (!roomId || !participantId || !socket) return;
    if (hasJoinedRef.current) return;

    const payload = { roomId, participantId, webRTCPeerId };

    if (!socket.connected) {
      const onConnect = () => {
        socket.emit(WEBSOCKET_EVENTS.JOIN_ROOM, payload);
        hasJoinedRef.current = true;
        socket.off('connect', onConnect);
      };
      socket.on('connect', onConnect);
      return;
    }

    socket.emit(WEBSOCKET_EVENTS.JOIN_ROOM, payload);
    hasJoinedRef.current = true;
  }, [roomId, participantId]);

  // --- 2. Leave Room ---
  const leaveRoom = useCallback(() => {
    const socket = websocketService.getMeetingsSocket();
    if (socket && roomId) {
      socket.emit(WEBSOCKET_EVENTS.LEAVE_ROOM, { roomId });
      hasJoinedRef.current = false;
      dispatch(clearParticipants());
    }
  }, [roomId, dispatch]);

  // --- 3. SYNC STATE WITH SERVER (Phần sửa quan trọng nhất) ---
  // Khi bạn tắt cam/mic ở máy mình, code này sẽ báo cho server biết
  
  useEffect(() => {
    if (!hasJoinedRef.current || !roomId || !participantId) return;
    const socket = websocketService.getMeetingsSocket();
    
    // Gửi sự kiện tắt/bật Audio
    socket?.emit(WEBSOCKET_EVENTS.TOGGLE_AUDIO, { 
        roomId, participantId, isEnabled: isAudioEnabled 
    });
  }, [isAudioEnabled, roomId, participantId]);

  useEffect(() => {
    if (!hasJoinedRef.current || !roomId || !participantId) return;
    const socket = websocketService.getMeetingsSocket();

    // Gửi sự kiện tắt/bật Video -> Server sẽ báo cho người khác để hiện Avatar
    socket?.emit(WEBSOCKET_EVENTS.TOGGLE_VIDEO, { 
        roomId, participantId, isEnabled: isVideoEnabled 
    });
  }, [isVideoEnabled, roomId, participantId]);

  useEffect(() => {
    if (!hasJoinedRef.current || !roomId || !participantId) return;
    const socket = websocketService.getMeetingsSocket();

    if (isScreenSharing) {
        socket?.emit(WEBSOCKET_EVENTS.START_SCREEN_SHARE, { roomId, participantId });
    } else {
        socket?.emit(WEBSOCKET_EVENTS.STOP_SCREEN_SHARE, { roomId, participantId });
    }
  }, [isScreenSharing, roomId, participantId]);


  // --- 4. Socket Listeners (Nghe tin từ server để cập nhật UI) ---
  useEffect(() => {
    const socket = websocketService.getMeetingsSocket();
    if (!socket) return;

    const handleUserJoined = (data: { participant: any }) => {
      dispatch(addParticipant(data.participant));
      toast.success(`${data.participant.displayName} đã tham gia`);
    };

    const handleUserLeft = (data: { participantId: string }) => {
      dispatch(removeParticipant(data.participantId));
    };

    // Khi ai đó (hoặc chính mình từ device khác) update trạng thái
    const handleParticipantUpdated = (data: { participantId: string; updates: any }) => {
      console.log('🔄 Participant Updated:', data);
      // Redux sẽ cập nhật isVideoEnabled của người đó thành false -> VideoPlayer tự chuyển sang Avatar
      dispatch(updateParticipant({ id: data.participantId, updates: data.updates }));
    };

    const handleParticipantsList = (data: { participants: any[] }) => {
      dispatch(setParticipants(data.participants));
      if (participantId) {
        const local = data.participants.find((p) => p.id === participantId);
        if (local) dispatch(setLocalParticipant(local));
      }
    };

    const handleMeetingEnded = () => {
      toast.error('Cuộc họp đã kết thúc');
      dispatch(clearParticipants());
      dispatch(clearMeeting());
      hasJoinedRef.current = false;
      navigate('/dashboard');
    };

    socket.on(WEBSOCKET_EVENTS.USER_JOINED, handleUserJoined);
    socket.on(WEBSOCKET_EVENTS.USER_LEFT, handleUserLeft);
    socket.on(WEBSOCKET_EVENTS.PARTICIPANT_UPDATED, handleParticipantUpdated);
    socket.on(WEBSOCKET_EVENTS.PARTICIPANTS_LIST, handleParticipantsList);
    socket.on(WEBSOCKET_EVENTS.MEETING_ENDED, handleMeetingEnded);

    return () => {
      socket.off(WEBSOCKET_EVENTS.USER_JOINED);
      socket.off(WEBSOCKET_EVENTS.USER_LEFT);
      socket.off(WEBSOCKET_EVENTS.PARTICIPANT_UPDATED);
      socket.off(WEBSOCKET_EVENTS.PARTICIPANTS_LIST);
      socket.off(WEBSOCKET_EVENTS.MEETING_ENDED);
    };
  }, [dispatch, navigate, participantId]); 

  useEffect(() => {
    return () => { hasJoinedRef.current = false; };
  }, []);

  return { joinRoom, leaveRoom };
};