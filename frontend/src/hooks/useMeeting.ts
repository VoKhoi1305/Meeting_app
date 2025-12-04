
import { useEffect, useCallback, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import type { RootState, AppDispatch } from '../store/store';
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
import { Socket } from 'socket.io-client'; // Import type Socket

export const useMeeting = (
  roomId: string | null,
  participantId: string | null
) => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { isAudioEnabled, isVideoEnabled, isScreenSharing } = useSelector(
    (state: RootState) => state.mediaDevices
  );
  
  // State để lưu socket instance, giúp trigger re-render khi socket kết nối thành công
  const [socket, setSocket] = useState<Socket | null>(websocketService.getMeetingsSocket());
  
  // Track if we've joined to prevent multiple joins
  const hasJoinedRef = useRef(false);

  // --- 1. Lắng nghe sự thay đổi của Socket Service ---
  // Điều này đảm bảo khi websocketService kết nối xong, hook này sẽ nhận được socket mới
  useEffect(() => {
    const checkSocket = setInterval(() => {
      const currentSocket = websocketService.getMeetingsSocket();
      if (currentSocket && currentSocket.connected && currentSocket !== socket) {
        console.log('🔌 Hook detected active socket');
        setSocket(currentSocket);
        clearInterval(checkSocket);
      }
    }, 500); // Kiểm tra mỗi 500ms

    return () => clearInterval(checkSocket);
  }, [socket]);


  // --- 2. Hàm Join Room (Sửa logic lấy socket) ---
  const joinRoom = useCallback(() => {
    // ⚠️ QUAN TRỌNG: Lấy socket trực tiếp từ Service tại thời điểm gọi hàm
    // Để tránh trường hợp biến state 'socket' chưa kịp cập nhật
    const activeSocket = websocketService.getMeetingsSocket();

    if (!roomId || !participantId) {
      console.warn('⚠️ Cannot join room: missing roomId/participantId');
      return;
    }

    if (!activeSocket || !activeSocket.connected) {
      console.warn('⚠️ Socket not ready yet. Retrying in 1s...');
      // Tự động thử lại sau 1 giây nếu socket chưa sẵn sàng
      setTimeout(joinRoom, 1000);
      return;
    }

    if (hasJoinedRef.current) {
      console.log('✅ Already joined room');
      return;
    }

    console.log('🔌 Joining room:', { roomId, participantId });
    
    activeSocket.emit(WEBSOCKET_EVENTS.JOIN_ROOM, {
      roomId,
      participantId,
    });
    
    hasJoinedRef.current = true;
    // Cập nhật lại state socket nếu cần
    setSocket(activeSocket);

  }, [roomId, participantId]); // Bỏ dependency 'socket' cũ đi

  // --- 3. Các hàm khác dùng biến 'socket' từ state ---
  // Leave meeting room
  const leaveRoom = useCallback(() => {
    const activeSocket = websocketService.getMeetingsSocket(); // Luôn lấy instance mới nhất
    if (activeSocket && roomId && hasJoinedRef.current) {
      console.log('👋 Leaving room:', roomId);
      activeSocket.emit(WEBSOCKET_EVENTS.LEAVE_ROOM, { roomId });
      hasJoinedRef.current = false;
    }
  }, [roomId]);

  // Toggle audio
  const toggleAudio = useCallback(
    (enabled: boolean) => {
      const activeSocket = websocketService.getMeetingsSocket();
      if (activeSocket && roomId && participantId) {
        activeSocket.emit(WEBSOCKET_EVENTS.TOGGLE_AUDIO, {
          roomId,
          participantId,
          isEnabled: enabled,
        });
      }
    },
    [roomId, participantId]
  );

  // Toggle video
  const toggleVideo = useCallback(
    (enabled: boolean) => {
      const activeSocket = websocketService.getMeetingsSocket();
      if (activeSocket && roomId && participantId) {
        activeSocket.emit(WEBSOCKET_EVENTS.TOGGLE_VIDEO, {
          roomId,
          participantId,
          isEnabled: enabled,
        });
      }
    },
    [roomId, participantId]
  );

  // Start screen share
  const startScreenShare = useCallback(() => {
    const activeSocket = websocketService.getMeetingsSocket();
    if (activeSocket && roomId && participantId) {
      activeSocket.emit(WEBSOCKET_EVENTS.START_SCREEN_SHARE, {
        roomId,
        participantId,
      });
    }
  }, [roomId, participantId]);

  // Stop screen share
  const stopScreenShare = useCallback(() => {
    const activeSocket = websocketService.getMeetingsSocket();
    if (activeSocket && roomId && participantId) {
      activeSocket.emit(WEBSOCKET_EVENTS.STOP_SCREEN_SHARE, {
        roomId,
        participantId,
      });
    }
  }, [roomId, participantId]);

  // --- Event Handlers ---
  const handleUserJoined = useCallback(
    (data: { participant: any }) => {
      console.log('👤 User joined:', data.participant.displayName);
      dispatch(addParticipant(data.participant));
      toast.success(`${data.participant.displayName} joined`);
    },
    [dispatch]
  );

  const handleUserLeft = useCallback(
    (data: { participantId: string }) => {
      console.log('👋 User left:', data.participantId);
      dispatch(removeParticipant(data.participantId));
    },
    [dispatch]
  );

  const handleParticipantUpdated = useCallback(
    (data: { participantId: string; updates: any }) => {
      console.log('🔄 Participant updated:', data);
      dispatch(
        updateParticipant({
          id: data.participantId,
          updates: data.updates,
        })
      );
    },
    [dispatch]
  );

  const handleParticipantsList = useCallback(
    (data: { participants: any[] }) => {
      console.log('📋 Participants list received:', data.participants.length);
      dispatch(setParticipants(data.participants));

      const localPart = data.participants.find((p) => p.id === participantId);
      if (localPart) {
        console.log('👤 Setting local participant:', localPart.displayName);
        dispatch(setLocalParticipant(localPart));
      } else {
        console.warn('⚠️ Local participant not found in list');
      }
    },
    [dispatch, participantId]
  );

  const handleMeetingEnded = useCallback(() => {
    console.log('🛑 Meeting ended');
    toast.error('Meeting has ended');
    dispatch(clearParticipants());
    dispatch(clearMeeting());
    hasJoinedRef.current = false;
    navigate('/dashboard');
  }, [dispatch, navigate]);

  // Sync local state with server
  const syncTimeoutRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
    syncTimeoutRef.current = window.setTimeout(() => {
      if (hasJoinedRef.current) toggleAudio(isAudioEnabled);
    }, 300);
    return () => clearTimeout(syncTimeoutRef.current);
  }, [isAudioEnabled, toggleAudio]);

  useEffect(() => {
    if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
    syncTimeoutRef.current = window.setTimeout(() => {
      if (hasJoinedRef.current) toggleVideo(isVideoEnabled);
    }, 300);
    return () => clearTimeout(syncTimeoutRef.current);
  }, [isVideoEnabled, toggleVideo]);

  useEffect(() => {
    if (hasJoinedRef.current) {
      if (isScreenSharing) startScreenShare();
      else stopScreenShare();
    }
  }, [isScreenSharing, startScreenShare, stopScreenShare]);

  // --- Setup Socket Listeners ---
  useEffect(() => {
    // Lấy socket hiện tại (có thể là null hoặc active)
    const currentSocket = socket || websocketService.getMeetingsSocket();

    if (!currentSocket) {
      return;
    }

    console.log('🔌 Setting up meeting socket listeners');

    currentSocket.on(WEBSOCKET_EVENTS.USER_JOINED, handleUserJoined);
    currentSocket.on(WEBSOCKET_EVENTS.USER_LEFT, handleUserLeft);
    currentSocket.on(WEBSOCKET_EVENTS.PARTICIPANT_UPDATED, handleParticipantUpdated);
    currentSocket.on(WEBSOCKET_EVENTS.PARTICIPANTS_LIST, handleParticipantsList);
    currentSocket.on(WEBSOCKET_EVENTS.MEETING_ENDED, handleMeetingEnded);

    return () => {
      console.log('🧹 Cleaning up meeting socket listeners');
      currentSocket.off(WEBSOCKET_EVENTS.USER_JOINED, handleUserJoined);
      currentSocket.off(WEBSOCKET_EVENTS.USER_LEFT, handleUserLeft);
      currentSocket.off(WEBSOCKET_EVENTS.PARTICIPANT_UPDATED, handleParticipantUpdated);
      currentSocket.off(WEBSOCKET_EVENTS.PARTICIPANTS_LIST, handleParticipantsList);
      currentSocket.off(WEBSOCKET_EVENTS.MEETING_ENDED, handleMeetingEnded);
    };
  }, [
    socket, // Re-run effect khi socket thay đổi
    handleUserJoined,
    handleUserLeft,
    handleParticipantUpdated,
    handleParticipantsList,
    handleMeetingEnded,
  ]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      hasJoinedRef.current = false;
    };
  }, []);

  return {
    joinRoom,
    leaveRoom,
  };
};