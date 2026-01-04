// import React, { useEffect, useState, useRef, useMemo } from 'react';
// import { useParams, useNavigate } from 'react-router-dom';
// import { useDispatch, useSelector } from 'react-redux';
// import type { RootState, AppDispatch } from '../../store/store';
// import { getMeetingByRoomId, joinMeeting, setIsHost } from '../../store/slices/meetingSlice';
// import { updateParticipant } from '../../store/slices/participantsSlice';
// import { useMediaStream } from '../../hooks/useMediaStream';
// import { useMeeting } from '../../hooks/useMeeting';
// import { useWebRTC } from '../../hooks/useWebRTC';
// import websocketService from '../../services/websocket.service';
// import { useZipformer } from '../../hooks/useZipformer'; 
// import SubtitleOverlay from '../../components/video/SubtitleOverlay';
// import VideoGrid from '../../components/video/VideoGrid';
// import MeetingControls from '../../components/video/MeetingControls';
// import ParticipantsList from '../../components/video/ParticipantsList';
// import SettingsModal from '../../components/settings/SettingsModal';
// import Loading from '../../components/common/Loading';
// import { Copy, Users } from 'lucide-react';
// import toast from 'react-hot-toast';

// const MeetingRoom: React.FC = () => {
//   const { roomId } = useParams<{ roomId: string }>();
//   const navigate = useNavigate();
//   const dispatch = useDispatch<AppDispatch>();
  
//   // Redux States
//   const { user, isAuthenticated, token } = useSelector((state: RootState) => state.auth);
//   const { current: meeting, myParticipantId, loading } = useSelector((state: RootState) => state.meeting);
//   const { localStream } = useSelector((state: RootState) => state.mediaDevices);
//   const participants = useSelector((state: RootState) => state.participants.list);

//   // Local States
//   const [showParticipants, setShowParticipants] = useState(false);
//   const [isReady, setIsReady] = useState(false);
//   const [showSettings, setShowSettings] = useState(false);
//   const [backgroundImage, setBackgroundImage] = useState<string | null>(null);

//   // Media & WebRTC Hooks
//   const { startLocalStream, stopLocalStream } = useMediaStream();
//   const webrtcSocketRef = useRef<any>(null);

//   // Meeting Logic Hook
//   const { joinRoom, leaveRoom, changeDisplayName } = useMeeting(meeting?.roomId || null, myParticipantId);
//   useWebRTC(isReady ? webrtcSocketRef.current : null, meeting?.roomId || null, localStream);

//   // Lấy trạng thái Audio để quyết định bật/tắt AI nghe
//   const isAudioEnabled = useSelector((state: RootState) => 
//     state.mediaDevices.localStream?.getAudioTracks()[0]?.enabled || false
//   );

//   const memoizedDisplayName = useMemo(() => {
//     const me = participants.find(p => p.id === myParticipantId);
//     return me?.displayName || user?.fullName || 'Người dùng';
//   }, [participants, myParticipantId, user]);

//   // --- SỬ DỤNG HOOK ZIPFORMER ---
//   const { isModelReady } = useZipformer(
//     webrtcSocketRef.current, 
//     meeting?.roomId || null, 
//     memoizedDisplayName,
//     isReady && isAudioEnabled 
//   );

//   // // Effect Debug trạng thái model
//   // useEffect(() => {
//   //   if (isModelReady) {
//   //       console.log("🟢 Hệ thống phụ đề AI đã kích hoạt");
//   //   }
//   // }, [isModelReady]);

//   useEffect(() => {
//     const savedBg = localStorage.getItem('meeting_background');
//     if (savedBg) setBackgroundImage(savedBg);
//   }, []);

//   useEffect(() => {
//     if (!isAuthenticated || !token) {
//         toast.error("Vui lòng đăng nhập");
//         navigate('/login');
//     }
//   }, [isAuthenticated, token, navigate]);

//   useEffect(() => {
//     if (isAuthenticated && token) {
//         websocketService.connectMeetings();
//         webrtcSocketRef.current = websocketService.connectWebRTC();
//     }
//     return () => { websocketService.disconnectAll(); }
//   }, [isAuthenticated, token]);

//   useEffect(() => {
//     if (roomId && !meeting && isAuthenticated) {
//       dispatch(getMeetingByRoomId(roomId)).catch(() => navigate('/dashboard'));
//     }
//   }, [roomId, meeting, dispatch, navigate, isAuthenticated]);

//   useEffect(() => {
//     if (meeting && user) dispatch(setIsHost(meeting.hostId === user.id));
//   }, [meeting, user, dispatch]);

// useEffect(() => {
//     let timer: any;
//     let cancelled = false;

//     const init = async () => {
//       if (cancelled) return; 

//       if (!meeting || !user || !roomId || !token) return;

//       try {
//         if (!localStream) {
//             await startLocalStream();
//         }
        
//         if (cancelled) return;

//         if (!myParticipantId) {
//             await dispatch(joinMeeting({ meetingId: meeting.id, displayName: user.fullName })).unwrap();
//         }
        
//         if (cancelled) return;

//         const waitForWebRTCId = () => {
//             if (cancelled) return; 

//             const socket = webrtcSocketRef.current;
//             if (socket && socket.id) {
//                 joinRoom(socket.id);
//                 if (!cancelled) setIsReady(true);
//             } else {
             
//                 setTimeout(waitForWebRTCId, 100); 
//             }
//         };
        
//         waitForWebRTCId();

//       } catch (error) {
//         if (!cancelled) {
//             console.error(error);
//             toast.error('Lỗi khi tham gia');
//         }
//       }
//     };


//     timer = setTimeout(() => {
//        if (meeting && user && !isReady) {
//          init();
//        }
//     }, 50);

//     return () => {
//       cancelled = true; 
//       clearTimeout(timer);
//     };
//   }, [meeting, user, roomId, isReady, localStream, myParticipantId, dispatch, startLocalStream, joinRoom, token]);
//   // --- HANDLERS ---
//   const handleCopyCode = () => {
//     if (meeting) {
//       navigator.clipboard.writeText(meeting.roomCode);
//       toast.success('Đã sao chép mã phòng');
//     }
//   };

//   const handleSaveName = (newName: string) => {
//     if (!newName.trim()) return toast.error('Tên không hợp lệ');
    
//     if (changeDisplayName) changeDisplayName(newName);
    
//     if (myParticipantId) {
//       dispatch(updateParticipant({ id: myParticipantId, updates: { displayName: newName } }));
//     }
    
//     toast.success('Đã đổi tên');
//     setShowSettings(false);
//   };

//   const currentDisplayName = useMemo(() => {
//     const me = participants.find(p => p.id === myParticipantId);
//     return me?.displayName || user?.fullName || '';
//   }, [participants, myParticipantId, user]);

//   if (loading || !meeting) return <Loading />;
//   if (!user) return null;

//   return (
//     <div className="relative h-screen w-screen overflow-hidden bg-gray-950 font-sans">
      
//       {/* 1. BACKGROUND LAYER */}
//       {backgroundImage && (
//         <div className="absolute inset-0 z-0">
//           <img src={backgroundImage} alt="Room Background" className="h-full w-full object-cover animate-in fade-in duration-700" />
//           <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px]"></div>
//         </div>
//       )}

//       {/* 2. CONTENT LAYER */}
//       <div className="relative z-10 flex h-full flex-col">
        
//         {/* Header */}
//         <div className="flex items-center justify-between px-6 py-4">
//           <div className="bg-gray-900/60 backdrop-blur-md border border-white/10 rounded-2xl px-4 py-2 flex items-center gap-4">
//              <h1 className="text-white font-bold text-lg">{meeting.title}</h1>
//              <div className="h-4 w-px bg-gray-500/50"></div>
//              <button onClick={handleCopyCode} className="flex items-center gap-2 text-sm text-gray-300 hover:text-white transition group">
//                 <span className="font-mono bg-gray-800 px-2 py-0.5 rounded text-blue-400 group-hover:bg-gray-700">{meeting.roomCode}</span>
//                 <Copy size={14} />
//              </button>
//           </div>

//           <div className="flex gap-2">
//             <button 
//               onClick={() => setShowParticipants(!showParticipants)} 
//               className={`px-4 py-2 rounded-xl border border-white/10 backdrop-blur-md transition flex items-center gap-2 font-medium
//                 ${showParticipants ? 'bg-blue-600 text-white' : 'bg-gray-900/60 text-gray-300 hover:bg-gray-800'}`}
//             >
//               <Users size={18} />
//               <span className="hidden sm:inline">Mọi người ({participants.length})</span>
//             </button>
//           </div>
//         </div>

//         {/* --- HIỂN THỊ PHỤ ĐỀ --- */}
//         <SubtitleOverlay />

//         {/* Main Area */}
//         <div className="flex-1 flex overflow-hidden p-4 gap-4 pb-24"> 
          
//           {/* Video Grid Area */}
//           <div className={`flex-1 transition-all duration-300 rounded-3xl overflow-hidden ${backgroundImage ? '' : 'bg-gray-900'}`}>
//             {localStream ? (
//                <VideoGrid /> 
//             ) : (
//                <div className="flex h-full flex-col items-center justify-center text-gray-400 gap-4">
//                  <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
//                  <p>Đang kết nối tới Camera...</p>
//                </div>
//             )}
//           </div>

//           {/* Sidebar Participants */}
//           {showParticipants && (
//             <div className="w-80 shrink-0 bg-gray-900/90 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden shadow-2xl animate-in slide-in-from-right duration-300">
//               <ParticipantsList />
//             </div>
//           )}
//         </div>

//         {/* Footer Controls */}
//         <MeetingControls onOpenSettings={() => setShowSettings(true)} />
//       </div>

//       {/* 3. MODAL LAYER */}
//       <SettingsModal 
//         isOpen={showSettings}
//         onClose={() => setShowSettings(false)}
//         currentName={currentDisplayName}
//         onSaveName={handleSaveName}
//         currentBackground={backgroundImage}
//         onBackgroundChange={setBackgroundImage}
//       />
//     </div>
//   );
// };

// export default MeetingRoom;

import React, { useEffect, useState, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState, AppDispatch } from '../../store/store';
// --- THÊM IMPORT clearMeeting ---
import { getMeetingByRoomId, joinMeeting, setIsHost, clearMeeting } from '../../store/slices/meetingSlice';
// --- THÊM IMPORT clearParticipants ---
import { updateParticipant, clearParticipants } from '../../store/slices/participantsSlice';
import { useMediaStream } from '../../hooks/useMediaStream';
import { useMeeting } from '../../hooks/useMeeting';
import { useWebRTC } from '../../hooks/useWebRTC';
import websocketService from '../../services/websocket.service';
import { useZipformer } from '../../hooks/useZipformer'; 
import SubtitleOverlay from '../../components/video/SubtitleOverlay';
import VideoGrid from '../../components/video/VideoGrid';
import MeetingControls from '../../components/video/MeetingControls';
import ParticipantsList from '../../components/video/ParticipantsList';
import SettingsModal from '../../components/settings/SettingsModal';
import Loading from '../../components/common/Loading';
import { Copy, Users } from 'lucide-react';
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

  // Lấy trạng thái Audio để quyết định bật/tắt AI nghe
  const isAudioEnabled = useSelector((state: RootState) => 
    state.mediaDevices.localStream?.getAudioTracks()[0]?.enabled || false
  );

  const memoizedDisplayName = useMemo(() => {
    const me = participants.find(p => p.id === myParticipantId);
    return me?.displayName || user?.fullName || 'Người dùng';
  }, [participants, myParticipantId, user]);

  // --- SỬ DỤNG HOOK ZIPFORMER ---
  const { isModelReady } = useZipformer(
    webrtcSocketRef.current, 
    meeting?.roomId || null, 
    memoizedDisplayName,
    isReady && isAudioEnabled 
  );

  useEffect(() => {
    // Cleanup function chỉ chạy khi Component Unmount (người dùng thoát trang)
    return () => {
       // Dọn dẹp WebRTC
       leaveRoom();
       stopLocalStream();
       setIsReady(false);

       // Dọn dẹp Redux State để lần sau vào không bị lỗi phòng cũ
       dispatch(clearMeeting());
       dispatch(clearParticipants());
       
       // Ngắt kết nối socket
       websocketService.disconnectAll();
    };
    // Dependency array RỖNG [] đảm bảo nó chỉ chạy 1 lần khi hủy component
  }, []); 

  useEffect(() => {
    const savedBg = localStorage.getItem('meeting_background');
    if (savedBg) setBackgroundImage(savedBg);
  }, []);

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
    // Đã chuyển disconnectAll lên Effect 1 để quản lý tập trung
  }, [isAuthenticated, token]);

  useEffect(() => {
    if (roomId && !meeting && isAuthenticated) {
      dispatch(getMeetingByRoomId(roomId)).catch(() => navigate('/dashboard'));
    }
  }, [roomId, meeting, dispatch, navigate, isAuthenticated]);

  useEffect(() => {
    if (meeting && user) dispatch(setIsHost(meeting.hostId === user.id));
  }, [meeting, user, dispatch]);

  // --- EFFECT 2: INIT LOGIC (JOIN & WEBRTC) ---
  useEffect(() => {
    let timer: any;
    let cancelled = false;

    const init = async () => {
      if (cancelled) return; 
      if (!meeting || !user || !roomId || !token) return;

      try {
        // 1. Lấy Stream Camera/Mic
        if (!localStream) {
            await startLocalStream();
        }
        if (cancelled) return;

        // 2. Gọi API Join Meeting (chỉ gọi nếu chưa có ID)
        if (!myParticipantId) {
            await dispatch(joinMeeting({ meetingId: meeting.id, displayName: user.fullName })).unwrap();
        }
        if (cancelled) return;

        // 3. Đợi Socket WebRTC sẵn sàng và Join Room Socket
        const waitForWebRTCId = () => {
            if (cancelled) return; 

            const socket = webrtcSocketRef.current;
            if (socket && socket.id) {
                joinRoom(socket.id);
                if (!cancelled) setIsReady(true);
            } else {
                // Thử lại sau 100ms nếu chưa có socket id
                setTimeout(waitForWebRTCId, 100); 
            }
        };
        waitForWebRTCId();

      } catch (error) {
        if (!cancelled) {
            console.error(error);
            toast.error('Lỗi khi tham gia');
        }
      }
    };

    // Debounce 50ms để ổn định
    timer = setTimeout(() => {
       // Chỉ chạy init nếu chưa sẵn sàng
       if (meeting && user && !isReady) {
         init();
       }
    }, 50);

    return () => {
      cancelled = true; 
      clearTimeout(timer);
      // KHÔNG gọi clearMeeting() ở đây nữa -> Tránh vòng lặp vô tận
    };
  }, [meeting, user, roomId, isReady, localStream, myParticipantId, dispatch, startLocalStream, joinRoom, token]);


  // --- HANDLERS ---
  const handleCopyCode = () => {
    if (meeting) {
      navigator.clipboard.writeText(meeting.roomCode);
      toast.success('Đã sao chép mã phòng');
    }
  };

  const handleSaveName = (newName: string) => {
    if (!newName.trim()) return toast.error('Tên không hợp lệ');
    
    if (changeDisplayName) changeDisplayName(newName);
    
    if (myParticipantId) {
      dispatch(updateParticipant({ id: myParticipantId, updates: { displayName: newName } }));
    }
    
    toast.success('Đã đổi tên');
    setShowSettings(false);
  };

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

      {/* 2. CONTENT LAYER */}
      <div className="relative z-10 flex h-full flex-col">
        
        {/* Header */}
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

        {/* Main Area */}
        <div className="flex-1 flex overflow-hidden p-4 gap-4 pb-24"> 
          
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

          {/* Sidebar Participants */}
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