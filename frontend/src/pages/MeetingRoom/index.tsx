

// frontend/src/pages/MeetingRoom/index.tsx
import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState, AppDispatch } from '../../store/store';
import { getMeetingByRoomId, joinMeeting, setIsHost } from '../../store/slices/meetingSlice';
import { useMediaStream } from '../../hooks/useMediaStream';
import { useMeeting } from '../../hooks/useMeeting';
import { useWebRTC } from '../../hooks/useWebRTC';
import websocketService from '../../services/websocket.service';
import VideoGrid from '../../components/video/VideoGrid';
import MeetingControls from '../../components/video/MeetingControls';
import ParticipantsList from '../../components/video/ParticipantsList';
import Loading from '../../components/common/Loading';
import { Copy, Users } from 'lucide-react';
import toast from 'react-hot-toast';

const MeetingRoom: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  
  const { user, isAuthenticated, token } = useSelector((state: RootState) => state.auth);
  const { current: meeting, myParticipantId, loading } = useSelector((state: RootState) => state.meeting);
  const { localStream } = useSelector((state: RootState) => state.mediaDevices);

  const [showParticipants, setShowParticipants] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const { startLocalStream, stopLocalStream } = useMediaStream();
  
  const webrtcSocketRef = useRef<any>(null);

  // 0. Auth check
  useEffect(() => {
    if (!isAuthenticated || !token) {
        toast.error("Vui lòng đăng nhập");
        navigate('/login');
    }
  }, [isAuthenticated, token, navigate]);

  // 1. Init Sockets
  useEffect(() => {
    if (isAuthenticated && token) {
        websocketService.connectMeetings();
        webrtcSocketRef.current = websocketService.connectWebRTC();
    }
    return () => { websocketService.disconnectAll(); }
  }, [isAuthenticated, token]);

  const { joinRoom, leaveRoom } = useMeeting(meeting?.roomId || null, myParticipantId);
  
  useWebRTC(isReady ? webrtcSocketRef.current : null, meeting?.roomId || null, localStream);

  // 2. Load Data
  useEffect(() => {
    if (roomId && !meeting && isAuthenticated) {
      dispatch(getMeetingByRoomId(roomId)).catch(() => navigate('/dashboard'));
    }
  }, [roomId, meeting, dispatch, navigate, isAuthenticated]);

  useEffect(() => {
    if (meeting && user) dispatch(setIsHost(meeting.hostId === user.id));
  }, [meeting, user, dispatch]);

  // 3. Init Logic
  useEffect(() => {
    const init = async () => {
      if (!meeting || !user || !roomId || !token) return;
      try {
        if (!localStream) await startLocalStream();
        
        if (!myParticipantId) {
            await dispatch(joinMeeting({
                meetingId: meeting.id,
                displayName: user.fullName,
            })).unwrap();
        }

        // Đợi socket WebRTC sẵn sàng để lấy ID
        const waitForWebRTCId = () => {
            const socket = webrtcSocketRef.current;
            if (socket && socket.id) {
                console.log("✅ WebRTC ID ready:", socket.id);
                // Truyền ID này vào joinRoom để backend lưu lại
                joinRoom(socket.id);
                setIsReady(true);
            } else {
                // Thử lại sau 100ms nếu chưa có ID
                setTimeout(waitForWebRTCId, 100);
            }
        };
        
        waitForWebRTCId();

      } catch (error) {
        console.error(error);
        toast.error('Lỗi khi tham gia');
      }
    };

    if (meeting && user && !isReady) init();
  }, [meeting, user, roomId, isReady, localStream, myParticipantId, dispatch, startLocalStream, joinRoom, token]);

  useEffect(() => {
    return () => {
      leaveRoom();
      stopLocalStream();
      setIsReady(false);
    };
  }, []);

  const handleCopyCode = () => {
    if (meeting) navigator.clipboard.writeText(meeting.roomCode);
  };

  if (loading || !meeting) return <Loading />;
  if (!user) return null;

  return (
    <div className="h-screen bg-gray-900 flex flex-col">
      <div className="bg-gray-800 border-b border-gray-700 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white">{meeting.title}</h1>
            <button onClick={handleCopyCode} className="flex items-center gap-2 text-sm text-gray-300 hover:text-white mt-1">
              <Copy size={16} /> Code: {meeting.roomCode}
            </button>
          </div>
          <button onClick={() => setShowParticipants(!showParticipants)} className="px-4 py-2 bg-gray-700 text-white rounded">
            <Users size={20} />
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 overflow-hidden">
          {localStream ? <VideoGrid /> : <div className="flex h-full items-center justify-center text-white">Đang kết nối Camera...</div>}
        </div>
        {showParticipants && (
          <div className="w-80 bg-white border-l border-gray-200 overflow-hidden">
            <ParticipantsList />
          </div>
        )}
      </div>
      <MeetingControls />
    </div>
  );
};

export default MeetingRoom;