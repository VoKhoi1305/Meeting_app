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
  
  const { isAudioEnabled, isVideoEnabled, isScreenSharing } = useSelector(
    (state: RootState) => state.mediaDevices
  );
  
  const hasJoinedRef = useRef(false);

  // join Room
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
      socket.connect(); 
      return;
    }

    socket.emit(WEBSOCKET_EVENTS.JOIN_ROOM, payload);
    hasJoinedRef.current = true;
  }, [roomId, participantId]);

  //  leave Room
  const leaveRoom = useCallback(() => {
    const socket = websocketService.getMeetingsSocket();
    if (socket && roomId && participantId) {
      socket.emit('leave-meeting', { roomId, participantId });
      
      hasJoinedRef.current = false;
      dispatch(clearParticipants());
      dispatch(clearMeeting()); 
    }
  }, [roomId, participantId, dispatch]);

  //  end Meeting
  const endMeeting = useCallback(() => {
    const socket = websocketService.getMeetingsSocket();
    if (socket && roomId) {
      // console.log('Đang gửi sự kiện kết thúc cuộc họp...');
      socket.emit('meeting-ended', { roomId });
      
      dispatch(clearParticipants());
      dispatch(clearMeeting());
      hasJoinedRef.current = false;
    }
  }, [roomId, dispatch]);

  //  change Display Name
  const changeDisplayName = useCallback((newDisplayName: string) => {
    const socket = websocketService.getMeetingsSocket();
    if (socket?.connected && roomId && participantId) {
      socket.emit('update-name', { 
        roomId, 
        participantId, 
        displayName: newDisplayName 
      });
    }
  }, [roomId, participantId]);

 // media state effects
  useEffect(() => {
    if (!hasJoinedRef.current || !roomId || !participantId) return;
    const socket = websocketService.getMeetingsSocket();
    socket?.emit(WEBSOCKET_EVENTS.TOGGLE_AUDIO, { roomId, participantId, isEnabled: isAudioEnabled });
  }, [isAudioEnabled, roomId, participantId]);

  useEffect(() => {
    if (!hasJoinedRef.current || !roomId || !participantId) return;
    const socket = websocketService.getMeetingsSocket();
    socket?.emit(WEBSOCKET_EVENTS.TOGGLE_VIDEO, { roomId, participantId, isEnabled: isVideoEnabled });
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


  //socket event handlers
  useEffect(() => {
    const socket = websocketService.getMeetingsSocket();
    if (!socket) return;

    //user joined event
    const handleUserJoined = (data: { participant: any }) => {
      dispatch(addParticipant(data.participant));
      toast.success(`${data.participant.displayName} joined the meeting`);
    };

    //participant left event
    const handleParticipantLeft = (data: { participantId: string }) => {
      console.log('User Left Event:', data.participantId);
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

    const handleMeetingEnded = (data: { message?: string }) => {
      toast(data.message || 'meeting has ended', {
        icon: '🛑',
        duration: 4000
      });
      dispatch(clearParticipants());
      dispatch(clearMeeting());
      hasJoinedRef.current = false;
      navigate('/dashboard');
    };

    
    socket.on(WEBSOCKET_EVENTS.USER_JOINED, handleUserJoined);
    socket.on('participant-left', handleParticipantLeft); 
    socket.on('participant-updated', handleParticipantUpdated);
    socket.on('participants-list', handleParticipantsList);
    socket.on('meeting-ended', handleMeetingEnded);

    return () => {
      socket.off(WEBSOCKET_EVENTS.USER_JOINED);
      socket.off('participant-left');
      socket.off('participant-updated');
      socket.off('participants-list');
      socket.off('meeting-ended');
    };
  }, [dispatch, navigate, participantId]); 

  useEffect(() => {
    return () => { 
      hasJoinedRef.current = false; 
    };
  }, []);

  return { 
    joinRoom, 
    leaveRoom, 
    endMeeting,        
    changeDisplayName  
  };
};