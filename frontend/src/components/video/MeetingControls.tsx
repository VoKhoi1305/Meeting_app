// import React, { useState } from 'react';
// import { useNavigate } from 'react-router-dom';
// import { useDispatch, useSelector } from 'react-redux';
// import type { RootState, AppDispatch } from '../../store/store';
// import { useMediaStream } from '../../hooks/useMediaStream';
// import { endMeeting } from '../../store/slices/meetingSlice';
// import {
//   Mic,
//   MicOff,
//   Video,
//   VideoOff,
//   Monitor,
//   MonitorOff,
//   PhoneOff,
//   Settings,
//   Loader2,
// } from 'lucide-react';
// import toast from 'react-hot-toast';

// const MeetingControls: React.FC = () => {
//   const navigate = useNavigate();
//   const dispatch = useDispatch<AppDispatch>();
//   const { current: meeting, isHost } = useSelector((state: RootState) => state.meeting);
//   const { isAudioEnabled, isVideoEnabled, isScreenSharing } = useSelector(
//     (state: RootState) => state.mediaDevices
//   );

//   const {
//     toggleAudio,
//     toggleVideo,
//     startScreenShare,
//     stopScreenShare,
//   } = useMediaStream();

//   const [isTogglingVideo, setIsTogglingVideo] = useState(false);
//   const [isTogglingScreen, setIsTogglingScreen] = useState(false);

//   const handleToggleAudio = () => {
//     toggleAudio();
//   };

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
//     navigate('/dashboard');
//     toast.success('Left meeting');
//   };

//   const handleEndMeeting = async () => {
//     if (meeting && window.confirm('Are you sure you want to end this meeting for everyone?')) {
//       await dispatch(endMeeting(meeting.id));
//       navigate('/dashboard');
//     }
//   };

//   return (
//     <div className="fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-700 p-4">
//       <div className="max-w-4xl mx-auto flex items-center justify-center gap-4">
//         {/* Audio Toggle */}
//         <button
//           onClick={handleToggleAudio}
//           className={`p-4 rounded-full transition-colors ${
//             isAudioEnabled
//               ? 'bg-gray-700 hover:bg-gray-600'
//               : 'bg-red-600 hover:bg-red-700'
//           }`}
//           title={isAudioEnabled ? 'Mute' : 'Unmute'}
//         >
//           {isAudioEnabled ? (
//             <Mic className="text-white" size={24} />
//           ) : (
//             <MicOff className="text-white" size={24} />
//           )}
//         </button>

//         {/* Video Toggle */}
//         <button
//           onClick={handleToggleVideo}
//           disabled={isTogglingVideo}
//           className={`p-4 rounded-full transition-colors relative ${
//             isVideoEnabled
//               ? 'bg-gray-700 hover:bg-gray-600'
//               : 'bg-red-600 hover:bg-red-700'
//           } ${isTogglingVideo ? 'opacity-50 cursor-not-allowed' : ''}`}
//           title={isVideoEnabled ? 'Stop Video' : 'Start Video'}
//         >
//           {isTogglingVideo ? (
//             <Loader2 className="text-white animate-spin" size={24} />
//           ) : isVideoEnabled ? (
//             <Video className="text-white" size={24} />
//           ) : (
//             <VideoOff className="text-white" size={24} />
//           )}
//         </button>

        
//         <button
//           onClick={handleToggleScreenShare}
//           disabled={isTogglingScreen}
//           className={`p-4 rounded-full transition-colors ${
//             isScreenSharing
//               ? 'bg-blue-600 hover:bg-blue-700'
//               : 'bg-gray-700 hover:bg-gray-600'
//           } ${isTogglingScreen ? 'opacity-50 cursor-not-allowed' : ''}`}
//           title={isScreenSharing ? 'Stop Sharing' : 'Share Screen'}
//         >
//           {isTogglingScreen ? (
//             <Loader2 className="text-white animate-spin" size={24} />
//           ) : isScreenSharing ? (
//             <MonitorOff className="text-white" size={24} />
//           ) : (
//             <Monitor className="text-white" size={24} />
//           )}
//         </button>

//         {/* Settings */}
//         <button
//           className="p-4 rounded-full bg-gray-700 hover:bg-gray-600 transition-colors"
//           title="Settings"
//         >
//           <Settings className="text-white" size={24} />
//         </button>

//         {/* Leave/End Meeting */}
//         {isHost ? (
//           <button
//             onClick={handleEndMeeting}
//             className="px-6 py-4 rounded-full bg-red-600 hover:bg-red-700 transition-colors flex items-center gap-2"
//           >
//             <PhoneOff className="text-white" size={24} />
//             <span className="text-white font-medium">End Meeting</span>
//           </button>
//         ) : (
//           <button
//             onClick={handleLeaveMeeting}
//             className="px-6 py-4 rounded-full bg-red-600 hover:bg-red-700 transition-colors flex items-center gap-2"
//           >
//             <PhoneOff className="text-white" size={24} />
//             <span className="text-white font-medium">Leave</span>
//           </button>
//         )}
//       </div>
//     </div>
//   );
// };

// export default MeetingControls;

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState, AppDispatch } from '../../store/store';
import { useMediaStream } from '../../hooks/useMediaStream';
import { endMeeting } from '../../store/slices/meetingSlice';
import {
  Mic, MicOff, Video, VideoOff, Monitor, MonitorOff, PhoneOff, Settings, Loader2,
} from 'lucide-react';
import toast from 'react-hot-toast';

const MeetingControls: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { current: meeting, isHost } = useSelector((state: RootState) => state.meeting);
  const { isAudioEnabled, isVideoEnabled, isScreenSharing } = useSelector(
    (state: RootState) => state.mediaDevices
  );

  // Chỉ cần gọi hàm phần cứng, state thay đổi sẽ trigger useMeeting gửi socket
  const { toggleAudio, toggleVideo, startScreenShare, stopScreenShare } = useMediaStream();

  const [isTogglingVideo, setIsTogglingVideo] = useState(false);
  const [isTogglingScreen, setIsTogglingScreen] = useState(false);

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
    navigate('/dashboard');
    toast.success('Left meeting');
  };

  const handleEndMeeting = async () => {
    if (meeting && window.confirm('End meeting for everyone?')) {
      await dispatch(endMeeting(meeting.id));
      navigate('/dashboard');
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-700 p-4 z-50">
      <div className="max-w-4xl mx-auto flex items-center justify-center gap-4">
        {/* Audio Toggle */}
        <button
          onClick={toggleAudio}
          className={`p-4 rounded-full transition-colors ${
            isAudioEnabled ? 'bg-gray-700 hover:bg-gray-600' : 'bg-red-600 hover:bg-red-700'
          }`}
          title={isAudioEnabled ? 'Mute' : 'Unmute'}
        >
          {isAudioEnabled ? <Mic className="text-white" size={24} /> : <MicOff className="text-white" size={24} />}
        </button>

        {/* Video Toggle */}
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
        >
          {isTogglingScreen ? (
            <Loader2 className="text-white animate-spin" size={24} />
          ) : isScreenSharing ? (
            <MonitorOff className="text-white" size={24} />
          ) : (
            <Monitor className="text-white" size={24} />
          )}
        </button>

        {/* Settings */}
        <button className="p-4 rounded-full bg-gray-700 hover:bg-gray-600 transition-colors">
          <Settings className="text-white" size={24} />
        </button>

        {/* Leave/End */}
        {isHost ? (
          <button onClick={handleEndMeeting} className="px-6 py-4 rounded-full bg-red-600 hover:bg-red-700 flex gap-2">
            <PhoneOff className="text-white" size={24} />
            <span className="text-white font-medium">End</span>
          </button>
        ) : (
          <button onClick={handleLeaveMeeting} className="px-6 py-4 rounded-full bg-red-600 hover:bg-red-700 flex gap-2">
            <PhoneOff className="text-white" size={24} />
            <span className="text-white font-medium">Leave</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default MeetingControls;