// import React, { useState, useEffect } from 'react';
// import { useNavigate } from 'react-router-dom';
// import { useDispatch, useSelector } from 'react-redux';
// import type { RootState, AppDispatch } from '../../store/store';
// import { useMediaStream } from '../../hooks/useMediaStream';
// import { useMeeting } from '../../hooks/useMeeting';
// import { endMeeting as endMeetingAction } from '../../store/slices/meetingSlice';
// import {
//   Mic, MicOff, Video, VideoOff, Monitor, MonitorOff, 
//   PhoneOff, Settings, Loader2, X, User, Save
// } from 'lucide-react';
// import toast from 'react-hot-toast';

// const MeetingControls: React.FC = () => {
//   const navigate = useNavigate();
//   const dispatch = useDispatch<AppDispatch>();

//   // Lấy danh sách participants để tìm tên hiện tại của mình
//   const { current: meeting, isHost, myParticipantId } = useSelector(
//     (state: RootState) => state.meeting
//   );
//   const participants = useSelector((state: RootState) => state.participants.list);
  
//   const { isAudioEnabled, isVideoEnabled, isScreenSharing } = useSelector(
//     (state: RootState) => state.mediaDevices
//   );

//   const { toggleAudio, toggleVideo, startScreenShare, stopScreenShare } = useMediaStream();

//   // Lấy hàm changeDisplayName từ hook
//   const { leaveRoom, endMeeting: endMeetingSocket, changeDisplayName } = useMeeting(
//     meeting?.roomId || null, 
//     myParticipantId
//   );

//   // State cho UI
//   const [isTogglingVideo, setIsTogglingVideo] = useState(false);
//   const [isTogglingScreen, setIsTogglingScreen] = useState(false);
  
//   // State cho Settings Modal
//   const [showSettings, setShowSettings] = useState(false);
//   const [newName, setNewName] = useState('');

//   // Effect để set tên hiện tại vào input khi mở settings
//   useEffect(() => {
//     if (showSettings && myParticipantId) {
//       const me = participants.find(p => p.id === myParticipantId);
//       if (me) setNewName(me.displayName);
//     }
//   }, [showSettings, myParticipantId, participants]);

//   const handleToggleVideo = async () => {
//     setIsTogglingVideo(true);
//     try {
//       await toggleVideo(); 
//     } catch (error) {
//       console.error('Error toggling video:', error);
//     } finally {
//       setIsTogglingVideo(false);
//     }
//   };

//   const handleToggleScreenShare = async () => {
//     setIsTogglingScreen(true);
//     try {
//       if (isScreenSharing) {
//         await stopScreenShare();
//       } else {
//         await startScreenShare();
//       }
//     } catch (error) {
//       console.error('Screen share error:', error);
//     } finally {
//       setIsTogglingScreen(false);
//     }
//   };

//   const handleLeaveMeeting = () => {
//     if (leaveRoom) leaveRoom();
//     navigate('/dashboard');
//     toast.success('Left meeting');
//   };

//   const handleEndMeeting = async () => {
//     if (meeting && window.confirm('End meeting for everyone?')) {
//       try {
//         await dispatch(endMeetingAction(meeting.id)).unwrap();
//         if (endMeetingSocket) endMeetingSocket();
//         toast.success('Meeting ended successfully');
//         navigate('/dashboard');
//       } catch (error) {
//         console.error('Failed to end meeting:', error);
//         toast.error('Failed to end meeting');
//       }
//     }
//   };

//   // Hàm xử lý lưu tên mới
//   const handleSaveName = () => {
//     if (!newName.trim()) {
//       toast.error('Tên không được để trống');
//       return;
//     }
//     if (changeDisplayName) {
//       changeDisplayName(newName);
//       toast.success('Đã đổi tên thành công');
//       setShowSettings(false);
//     }
//   };

//   return (
//     <>
//       {/* --- SETTINGS MODAL --- */}
//       {showSettings && (
//         <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[60] p-4">
//           <div className="bg-gray-800 border border-gray-700 rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
//             {/* Modal Header */}
//             <div className="flex items-center justify-between p-4 border-b border-gray-700 bg-gray-800/50">
//               <h3 className="text-lg font-semibold text-white flex items-center gap-2">
//                 <Settings size={20} className="text-blue-400" />
//                 Cài đặt cuộc họp
//               </h3>
//               <button 
//                 onClick={() => setShowSettings(false)}
//                 className="text-gray-400 hover:text-white hover:bg-gray-700 p-1 rounded-lg transition"
//               >
//                 <X size={20} />
//               </button>
//             </div>

//             {/* Modal Body */}
//             <div className="p-6 space-y-4">
//               <div className="space-y-2">
//                 <label className="text-sm font-medium text-gray-300 block">Tên hiển thị</label>
//                 <div className="relative">
//                   <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
//                     <User size={18} className="text-gray-500" />
//                   </div>
//                   <input
//                     type="text"
//                     value={newName}
//                     onChange={(e) => setNewName(e.target.value)}
//                     onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
//                     className="w-full bg-gray-900 border border-gray-600 text-white rounded-lg pl-10 pr-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition outline-none"
//                     placeholder="Nhập tên của bạn..."
//                   />
//                 </div>
//                 <p className="text-xs text-gray-500">Tên này sẽ hiển thị với tất cả mọi người trong phòng.</p>
//               </div>
//             </div>

//             {/* Modal Footer */}
//             <div className="p-4 border-t border-gray-700 bg-gray-900/50 flex justify-end gap-3">
//               <button
//                 onClick={() => setShowSettings(false)}
//                 className="px-4 py-2 rounded-lg text-gray-300 hover:text-white hover:bg-gray-700 transition text-sm font-medium"
//               >
//                 Hủy
//               </button>
//               <button
//                 onClick={handleSaveName}
//                 className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2 transition text-sm font-medium"
//               >
//                 <Save size={16} />
//                 Lưu thay đổi
//               </button>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* --- CONTROL BAR --- */}
//       <div className="fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-700 p-4 z-50">
//         <div className="max-w-4xl mx-auto flex items-center justify-center gap-4">
//           {/* Audio Toggle */}
//           <button
//             onClick={toggleAudio}
//             className={`p-4 rounded-full transition-colors ${
//               isAudioEnabled ? 'bg-gray-700 hover:bg-gray-600' : 'bg-red-600 hover:bg-red-700'
//             }`}
//             title={isAudioEnabled ? 'Mute' : 'Unmute'}
//           >
//             {isAudioEnabled ? <Mic className="text-white" size={24} /> : <MicOff className="text-white" size={24} />}
//           </button>

//           {/* Video Toggle */}
//           <button
//             onClick={handleToggleVideo}
//             disabled={isTogglingVideo}
//             className={`p-4 rounded-full transition-colors relative ${
//               isVideoEnabled ? 'bg-gray-700 hover:bg-gray-600' : 'bg-red-600 hover:bg-red-700'
//             } ${isTogglingVideo ? 'opacity-50' : ''}`}
//             title={isVideoEnabled ? 'Stop Video' : 'Start Video'}
//           >
//             {isTogglingVideo ? (
//               <Loader2 className="text-white animate-spin" size={24} />
//             ) : isVideoEnabled ? (
//               <Video className="text-white" size={24} />
//             ) : (
//               <VideoOff className="text-white" size={24} />
//             )}
//           </button>

//           {/* Screen Share */}
//           <button
//             onClick={handleToggleScreenShare}
//             disabled={isTogglingScreen}
//             className={`p-4 rounded-full transition-colors ${
//               isScreenSharing ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-700 hover:bg-gray-600'
//             }`}
//             title="Share Screen"
//           >
//             {isTogglingScreen ? (
//               <Loader2 className="text-white animate-spin" size={24} />
//             ) : isScreenSharing ? (
//               <MonitorOff className="text-white" size={24} />
//             ) : (
//               <Monitor className="text-white" size={24} />
//             )}
//           </button>

//           {/* Settings Button - Giờ sẽ mở Modal */}
//           <button 
//             onClick={() => setShowSettings(true)}
//             className={`p-4 rounded-full transition-colors ${
//               showSettings ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'
//             }`}
//             title="Settings"
//           >
//             <Settings className="text-white" size={24} />
//           </button>

//           {/* Leave/End Buttons */}
//           {isHost ? (
//             <button onClick={handleEndMeeting} className="px-6 py-4 rounded-full bg-red-600 hover:bg-red-700 flex gap-2">
//               <PhoneOff className="text-white" size={24} />
//               <span className="text-white font-medium">End</span>
//             </button>
//           ) : (
//             <button onClick={handleLeaveMeeting} className="px-6 py-4 rounded-full bg-red-600 hover:bg-red-700 flex gap-2">
//               <PhoneOff className="text-white" size={24} />
//               <span className="text-white font-medium">Leave</span>
//             </button>
//           )}
//         </div>
//       </div>
//     </>
//   );
// };

// export default MeetingControls;

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState, AppDispatch } from '../../store/store';
import { useMediaStream } from '../../hooks/useMediaStream';
import { useMeeting } from '../../hooks/useMeeting';
import { endMeeting as endMeetingAction } from '../../store/slices/meetingSlice';
import { updateParticipant } from '../../store/slices/participantsSlice'; // [QUAN TRỌNG] Import action này
import {
  Mic, MicOff, Video, VideoOff, Monitor, MonitorOff, 
  PhoneOff, Settings, Loader2, X, User, Save
} from 'lucide-react';
import toast from 'react-hot-toast';

const MeetingControls: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();

  // Lấy dữ liệu từ Redux
  const { current: meeting, isHost, myParticipantId } = useSelector(
    (state: RootState) => state.meeting
  );
  
  // Lấy danh sách để tìm tên hiện tại (cho vào ô input ban đầu)
  const participants = useSelector((state: RootState) => state.participants.list);
  
  const { isAudioEnabled, isVideoEnabled, isScreenSharing } = useSelector(
    (state: RootState) => state.mediaDevices
  );

  const { toggleAudio, toggleVideo, startScreenShare, stopScreenShare } = useMediaStream();

  // Gọi hook useMeeting
  const { leaveRoom, endMeeting: endMeetingSocket, changeDisplayName } = useMeeting(
    meeting?.roomId || null, 
    myParticipantId
  );

  // State UI
  const [isTogglingVideo, setIsTogglingVideo] = useState(false);
  const [isTogglingScreen, setIsTogglingScreen] = useState(false);
  
  // State cho Modal đổi tên
  const [showSettings, setShowSettings] = useState(false);
  const [newName, setNewName] = useState('');

  // Effect: Khi mở modal, tự động điền tên hiện tại vào ô input
  useEffect(() => {
    if (showSettings && myParticipantId) {
      const me = participants.find(p => p.id === myParticipantId);
      if (me) setNewName(me.displayName);
    }
  }, [showSettings, myParticipantId, participants]);

  // --- CÁC HÀM XỬ LÝ ---

  const handleToggleVideo = async () => {
    setIsTogglingVideo(true);
    try {
      await toggleVideo(); 
    } catch (error) {
      console.error('Error toggling video:', error);
    } finally {
      setIsTogglingVideo(false);
    }
  };

  const handleToggleScreenShare = async () => {
    setIsTogglingScreen(true);
    try {
      if (isScreenSharing) {
        await stopScreenShare();
      } else {
        await startScreenShare();
      }
    } catch (error) {
      console.error('Screen share error:', error);
    } finally {
      setIsTogglingScreen(false);
    }
  };

  const handleLeaveMeeting = () => {
    if (leaveRoom) leaveRoom();
    navigate('/dashboard');
    toast.success('Left meeting');
  };

  const handleEndMeeting = async () => {
    if (meeting && window.confirm('Kết thúc cuộc họp cho tất cả mọi người?')) {
      try {
        await dispatch(endMeetingAction(meeting.id)).unwrap();
        if (endMeetingSocket) endMeetingSocket();
        toast.success('Đã kết thúc cuộc họp');
        navigate('/dashboard');
      } catch (error) {
        console.error('Failed to end meeting:', error);
        toast.error('Lỗi khi kết thúc cuộc họp');
      }
    }
  };

  // [QUAN TRỌNG] Hàm xử lý lưu tên mới
  const handleSaveName = () => {
    if (!newName.trim()) {
      toast.error('Tên không được để trống');
      return;
    }

    if (changeDisplayName && myParticipantId) {
      // 1. Gửi Socket lên server (để người khác thấy)
      changeDisplayName(newName);
      
      // 2. Cập nhật Redux ngay lập tức (để MÀN HÌNH BẢN THÂN thấy ngay)
      // Vì trong useMeeting dòng này đang bị comment nên ta làm ở đây
      dispatch(updateParticipant({ 
        id: myParticipantId, 
        updates: { displayName: newName } 
      }));

      toast.success('Đã đổi tên thành công');
      setShowSettings(false);
    }
  };

  return (
    <>
      {/* --- MODAL CÀI ĐẶT (Hiện ra khi bấm nút Settings) --- */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[60] p-4 animate-in fade-in duration-200">
          <div className="bg-gray-800 border border-gray-700 rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
            
            {/* Header Modal */}
            <div className="flex items-center justify-between p-4 border-b border-gray-700 bg-gray-800">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <Settings size={20} className="text-blue-400" />
                Cài đặt cuộc họp
              </h3>
              <button 
                onClick={() => setShowSettings(false)}
                className="text-gray-400 hover:text-white hover:bg-gray-700 p-1 rounded-lg transition"
              >
                <X size={20} />
              </button>
            </div>

            {/* Body Modal */}
            <div className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300 block">Tên hiển thị</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User size={18} className="text-gray-500" />
                  </div>
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
                    className="w-full bg-gray-900 border border-gray-600 text-white rounded-lg pl-10 pr-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition outline-none placeholder-gray-500"
                    placeholder="Nhập tên hiển thị mới..."
                    autoFocus
                  />
                </div>
                <p className="text-xs text-gray-500">Tên mới sẽ hiển thị ngay lập tức với mọi người.</p>
              </div>
            </div>

            {/* Footer Modal */}
            <div className="p-4 border-t border-gray-700 bg-gray-900/50 flex justify-end gap-3">
              <button
                onClick={() => setShowSettings(false)}
                className="px-4 py-2 rounded-lg text-gray-300 hover:text-white hover:bg-gray-700 transition text-sm font-medium"
              >
                Hủy
              </button>
              <button
                onClick={handleSaveName}
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2 transition text-sm font-medium shadow-lg shadow-blue-500/20"
              >
                <Save size={16} />
                Lưu thay đổi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- THANH ĐIỀU KHIỂN CHÍNH (Bottom Bar) --- */}
      <div className="fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-700 p-4 z-50">
        <div className="max-w-4xl mx-auto flex items-center justify-center gap-4">
          
          {/* Audio */}
          <button
            onClick={toggleAudio}
            className={`p-4 rounded-full transition-colors ${
              isAudioEnabled ? 'bg-gray-700 hover:bg-gray-600' : 'bg-red-600 hover:bg-red-700'
            }`}
            title={isAudioEnabled ? 'Mute' : 'Unmute'}
          >
            {isAudioEnabled ? <Mic className="text-white" size={24} /> : <MicOff className="text-white" size={24} />}
          </button>

          {/* Video */}
          <button
            onClick={handleToggleVideo}
            disabled={isTogglingVideo}
            className={`p-4 rounded-full transition-colors relative ${
              isVideoEnabled ? 'bg-gray-700 hover:bg-gray-600' : 'bg-red-600 hover:bg-red-700'
            } ${isTogglingVideo ? 'opacity-50' : ''}`}
            title={isVideoEnabled ? 'Stop Video' : 'Start Video'}
          >
            {isTogglingVideo ? (
              <Loader2 className="text-white animate-spin" size={24} />
            ) : isVideoEnabled ? (
              <Video className="text-white" size={24} />
            ) : (
              <VideoOff className="text-white" size={24} />
            )}
          </button>

          {/* Screen Share */}
          <button
            onClick={handleToggleScreenShare}
            disabled={isTogglingScreen}
            className={`p-4 rounded-full transition-colors ${
              isScreenSharing ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-700 hover:bg-gray-600'
            }`}
            title="Share Screen"
          >
            {isTogglingScreen ? (
              <Loader2 className="text-white animate-spin" size={24} />
            ) : isScreenSharing ? (
              <MonitorOff className="text-white" size={24} />
            ) : (
              <Monitor className="text-white" size={24} />
            )}
          </button>

          {/* Settings Button - Giờ sẽ mở Modal */}
          <button 
            onClick={() => setShowSettings(true)}
            className={`p-4 rounded-full transition-colors ${
              showSettings ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'
            }`}
            title="Settings"
          >
            <Settings className="text-white" size={24} />
          </button>

          {/* Leave/End Button */}
          {isHost ? (
            <button onClick={handleEndMeeting} className="px-6 py-4 rounded-full bg-red-600 hover:bg-red-700 flex gap-2 shadow-lg shadow-red-900/20">
              <PhoneOff className="text-white" size={24} />
              <span className="text-white font-medium">End</span>
            </button>
          ) : (
            <button onClick={handleLeaveMeeting} className="px-6 py-4 rounded-full bg-red-600 hover:bg-red-700 flex gap-2 shadow-lg shadow-red-900/20">
              <PhoneOff className="text-white" size={24} />
              <span className="text-white font-medium">Leave</span>
            </button>
          )}
        </div>
      </div>
    </>
  );
};

export default MeetingControls;