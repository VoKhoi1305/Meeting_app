

import React, { useEffect, useState, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState, AppDispatch } from '../../store/store';
import { getMeetingByRoomId, joinMeeting, setIsHost } from '../../store/slices/meetingSlice';
import { updateParticipant } from '../../store/slices/participantsSlice'; // Import thêm action này
import { useMediaStream } from '../../hooks/useMediaStream';
import { useMeeting } from '../../hooks/useMeeting';
import { useWebRTC } from '../../hooks/useWebRTC';
import websocketService from '../../services/websocket.service';
import { useSpeechToText } from '../../hooks/useSpeechToText';
import SubtitleOverlay from '../../components/video/SubtitleOverlay';
// Components
import VideoGrid from '../../components/video/VideoGrid';
import MeetingControls from '../../components/video/MeetingControls';
import ParticipantsList from '../../components/video/ParticipantsList';
import SettingsModal from '../../components/settings/SettingsModal'; // Import Modal mới
import Loading from '../../components/common/Loading';
import { Copy, Users, Clock } from 'lucide-react';
import toast from 'react-hot-toast';

const MeetingRoom: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  
  // Redux States
  const { user, isAuthenticated, token } = useSelector((state: RootState) => state.auth);
  const { current: meeting, myParticipantId, loading } = useSelector((state: RootState) => state.meeting);
  const { localStream } = useSelector((state: RootState) => state.mediaDevices);
  const participants = useSelector((state: RootState) => state.participants.list);

  // Local States
  const [showParticipants, setShowParticipants] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [backgroundImage, setBackgroundImage] = useState<string | null>(null);

  // Media & WebRTC Hooks
  const { startLocalStream, stopLocalStream } = useMediaStream();
  const webrtcSocketRef = useRef<any>(null);

  // Meeting Logic Hook
  const { joinRoom, leaveRoom, changeDisplayName } = useMeeting(meeting?.roomId || null, myParticipantId);
  useWebRTC(isReady ? webrtcSocketRef.current : null, meeting?.roomId || null, localStream);
  // Speech-to-Text Hook
  const isAudioEnabled = useSelector((state: RootState) => 
    state.mediaDevices.localStream?.getAudioTracks()[0]?.enabled || false
  );

  // Kích hoạt chức năng phụ đề cho chính mình (chỉ khi không bị mute)
  useSpeechToText(
    webrtcSocketRef.current, 
    meeting?.roomId || null, 
    isReady && isAudioEnabled
  );
  
  // --- LOGIC HÌNH NỀN ---
  useEffect(() => {
    // Load hình nền đã lưu
    const savedBg = localStorage.getItem('meeting_background');
    if (savedBg) setBackgroundImage(savedBg);
  }, []);

  // --- LOGIC AUTH & INIT ---
  useEffect(() => {
    if (!isAuthenticated || !token) {
        toast.error("Vui lòng đăng nhập");
        navigate('/login');
    }
  }, [isAuthenticated, token, navigate]);

  useEffect(() => {
    if (isAuthenticated && token) {
        websocketService.connectMeetings();
        webrtcSocketRef.current = websocketService.connectWebRTC();
    }
    return () => { websocketService.disconnectAll(); }
  }, [isAuthenticated, token]);

  useEffect(() => {
    if (roomId && !meeting && isAuthenticated) {
      dispatch(getMeetingByRoomId(roomId)).catch(() => navigate('/dashboard'));
    }
  }, [roomId, meeting, dispatch, navigate, isAuthenticated]);

  useEffect(() => {
    if (meeting && user) dispatch(setIsHost(meeting.hostId === user.id));
  }, [meeting, user, dispatch]);

  useEffect(() => {
    const init = async () => {
      if (!meeting || !user || !roomId || !token) return;
      try {
        if (!localStream) await startLocalStream();
        
        if (!myParticipantId) {
            await dispatch(joinMeeting({ meetingId: meeting.id, displayName: user.fullName })).unwrap();
        }

        const waitForWebRTCId = () => {
            const socket = webrtcSocketRef.current;
            if (socket && socket.id) {
                joinRoom(socket.id);
                setIsReady(true);
            } else {
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

  // --- HANDLERS ---
  const handleCopyCode = () => {
    if (meeting) {
      navigator.clipboard.writeText(meeting.roomCode);
      toast.success('Đã sao chép mã phòng');
    }
  };

  const handleSaveName = (newName: string) => {
    if (!newName.trim()) return toast.error('Tên không hợp lệ');
    
    // Gửi lên server
    if (changeDisplayName) changeDisplayName(newName);
    
    // Cập nhật Redux local ngay lập tức
    if (myParticipantId) {
      dispatch(updateParticipant({ id: myParticipantId, updates: { displayName: newName } }));
    }
    
    toast.success('Đã đổi tên');
    setShowSettings(false);
  };

  // Lấy tên hiện tại để pass vào modal
  const currentDisplayName = useMemo(() => {
    const me = participants.find(p => p.id === myParticipantId);
    return me?.displayName || user?.fullName || '';
  }, [participants, myParticipantId, user]);

  if (loading || !meeting) return <Loading />;
  if (!user) return null;

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-gray-950 font-sans">
      
      {/* 1. BACKGROUND LAYER */}
      {backgroundImage && (
        <div className="absolute inset-0 z-0">
          <img src={backgroundImage} alt="Room Background" className="h-full w-full object-cover animate-in fade-in duration-700" />
          <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px]"></div>
        </div>
      )}

      {/* 2. CONTENT LAYER (Nổi lên trên background) */}
      <div className="relative z-10 flex h-full flex-col">
        
        {/* Header Trong suốt */}
        <div className="flex items-center justify-between px-6 py-4">
          <div className="bg-gray-900/60 backdrop-blur-md border border-white/10 rounded-2xl px-4 py-2 flex items-center gap-4">
             <h1 className="text-white font-bold text-lg">{meeting.title}</h1>
             <div className="h-4 w-px bg-gray-500/50"></div>
             <button onClick={handleCopyCode} className="flex items-center gap-2 text-sm text-gray-300 hover:text-white transition group">
                <span className="font-mono bg-gray-800 px-2 py-0.5 rounded text-blue-400 group-hover:bg-gray-700">{meeting.roomCode}</span>
                <Copy size={14} />
             </button>
          </div>

          <div className="flex gap-2">
            <button 
              onClick={() => setShowParticipants(!showParticipants)} 
              className={`px-4 py-2 rounded-xl border border-white/10 backdrop-blur-md transition flex items-center gap-2 font-medium
                ${showParticipants ? 'bg-blue-600 text-white' : 'bg-gray-900/60 text-gray-300 hover:bg-gray-800'}`}
            >
              <Users size={18} />
              <span className="hidden sm:inline">Mọi người ({participants.length})</span>
            </button>
          </div>
        </div>

        {/* --- HIỂN THỊ PHỤ ĐỀ --- */}
        <SubtitleOverlay />

        {/* Main Area: Video Grid + Sidebar */}
        <div className="flex-1 flex overflow-hidden p-4 gap-4 pb-24"> {/* pb-24 để chừa chỗ cho Controls */}
          
          {/* Video Grid Area */}
          <div className={`flex-1 transition-all duration-300 rounded-3xl overflow-hidden ${backgroundImage ? '' : 'bg-gray-900'}`}>
            {localStream ? (
               <VideoGrid /> 
            ) : (
               <div className="flex h-full flex-col items-center justify-center text-gray-400 gap-4">
                 <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                 <p>Đang kết nối tới Camera...</p>
               </div>
            )}
          </div>

          {/* Sidebar Participants (Slide in) */}
          {showParticipants && (
            <div className="w-80 shrink-0 bg-gray-900/90 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden shadow-2xl animate-in slide-in-from-right duration-300">
              <ParticipantsList />
            </div>
          )}
        </div>

        {/* Footer Controls */}
        <MeetingControls onOpenSettings={() => setShowSettings(true)} />
      </div>

      {/* 3. MODAL LAYER */}
      <SettingsModal 
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        currentName={currentDisplayName}
        onSaveName={handleSaveName}
        currentBackground={backgroundImage}
        onBackgroundChange={setBackgroundImage}
      />
    </div>
  );
};

export default MeetingRoom;