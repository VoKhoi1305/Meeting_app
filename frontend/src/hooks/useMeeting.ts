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
  
  // Lấy trạng thái Media của chính mình
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
      socket.emit('leave-room', { roomId }); // Hoặc dùng WEBSOCKET_EVENTS.LEAVE_ROOM nếu file const đã định nghĩa
      hasJoinedRef.current = false;
      dispatch(clearParticipants());
    }
  }, [roomId, dispatch]);

  // --- 3. End Meeting (Cho Host) ---
  const endMeeting = useCallback(() => {
    const socket = websocketService.getMeetingsSocket();
    if (socket && roomId) {
      console.log('🔴 Đang gửi sự kiện kết thúc cuộc họp...');
      // Gửi sự kiện 'meeting-ended' lên server
      socket.emit('meeting-ended', { roomId });
      
      // Clear state ở local
      dispatch(clearParticipants());
      hasJoinedRef.current = false;
    }
  }, [roomId, dispatch]);

  // --- 4. Change Display Name ---
  const changeDisplayName = useCallback((newDisplayName: string) => {
    const socket = websocketService.getMeetingsSocket();
    if (socket?.connected && roomId && participantId) {
      // Gửi sự kiện 'update-name' lên server
      socket.emit('update-name', { 
        roomId, 
        participantId, 
        displayName: newDisplayName 
      });
      
      // (Optional) Cập nhật luôn Redux local ở đây để UI phản hồi nhanh
      // dispatch(updateParticipant({ id: participantId, updates: { displayName: newDisplayName } }));
    }
  }, [roomId, participantId]); // Thêm dispatch vào deps nếu bạn uncomment dòng trên

  // --- 5. Sync Media State with Server ---
  useEffect(() => {
    if (!hasJoinedRef.current || !roomId || !participantId) return;
    const socket = websocketService.getMeetingsSocket();
    
    socket?.emit(WEBSOCKET_EVENTS.TOGGLE_AUDIO, { 
        roomId, participantId, isEnabled: isAudioEnabled 
    });
  }, [isAudioEnabled, roomId, participantId]);

  useEffect(() => {
    if (!hasJoinedRef.current || !roomId || !participantId) return;
    const socket = websocketService.getMeetingsSocket();

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


  // --- 6. Socket Listeners ---
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

    const handleParticipantUpdated = (data: { participantId: string; updates: any }) => {
      dispatch(updateParticipant({ id: data.participantId, updates: data.updates }));
    };

    const handleParticipantsList = (data: { participants: any[] }) => {
      dispatch(setParticipants(data.participants));
      if (participantId) {
        const local = data.participants.find((p) => p.id === participantId);
        if (local) dispatch(setLocalParticipant(local));
      }
    };

    // Sự kiện khi Host kết thúc cuộc họp
    const handleMeetingEnded = (data: { message?: string }) => {
      toast(data.message || 'Cuộc họp đã kết thúc', {
        icon: '🛑',
        duration: 4000
      });
      dispatch(clearParticipants());
      dispatch(clearMeeting());
      hasJoinedRef.current = false;
      navigate('/dashboard');
    };

    // Đăng ký sự kiện
    socket.on(WEBSOCKET_EVENTS.USER_JOINED, handleUserJoined);
    socket.on('user-left', handleUserLeft); // Check lại key trong constant nếu cần
    socket.on('participant-updated', handleParticipantUpdated); // Check key
    socket.on('participants-list', handleParticipantsList); // Check key
    socket.on('meeting-ended', handleMeetingEnded); // Sự kiện mới

    return () => {
      // Hủy đăng ký
      socket.off(WEBSOCKET_EVENTS.USER_JOINED);
      socket.off('user-left');
      socket.off('participant-updated');
      socket.off('participants-list');
      socket.off('meeting-ended');
    };
  }, [dispatch, navigate, participantId]); 

  // Cleanup on unmount
  useEffect(() => {
    return () => { hasJoinedRef.current = false; };
  }, []);

  return { 
    joinRoom, 
    leaveRoom, 
    endMeeting,        
    changeDisplayName  
  };
};