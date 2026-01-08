import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import type { RootState, AppDispatch } from '../../store/store';
import { useMediaStream } from '../../hooks/useMediaStream';
import { useMeeting } from '../../hooks/useMeeting';
import { endMeeting as endMeetingAction } from '../../store/slices/meetingSlice';
import {
  Mic, MicOff, Video, VideoOff, Monitor, MonitorOff, 
  PhoneOff, Settings, Loader2, Image as ImageIcon, Sparkles 
} from 'lucide-react';
import toast from 'react-hot-toast';

interface MeetingControlsProps {
  onOpenSettings: () => void;
}

const MeetingControls: React.FC<MeetingControlsProps> = ({ onOpenSettings }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();

  const { current: meeting, isHost, myParticipantId } = useSelector(
    (state: RootState) => state.meeting
  );
  
  const { isAudioEnabled, isVideoEnabled, isScreenSharing, isBlurEnabled } = useSelector(
    (state: RootState) => (state as any).mediaDevices
  );

  const { 
    toggleAudio, toggleVideo, startScreenShare, stopScreenShare, 
    toggleBackgroundBlur 
  } = useMediaStream();
  
  const { leaveRoom, endMeeting: endMeetingSocket } = useMeeting(
    meeting?.roomId || null, 
    myParticipantId
  );

  const [isTogglingVideo, setIsTogglingVideo] = useState(false);
  const [isTogglingScreen, setIsTogglingScreen] = useState(false);
  const [isTogglingBlur, setIsTogglingBlur] = useState(false); 

  const handleToggleVideo = async () => {
    setIsTogglingVideo(true);
    try { await toggleVideo(); } 
    catch (error) { console.error(error); } 
    finally { setIsTogglingVideo(false); }
  };

  const handleToggleScreenShare = async () => {
    setIsTogglingScreen(true);
    try { isScreenSharing ? await stopScreenShare() : await startScreenShare(); } 
    catch (error) { console.error(error); } 
    finally { setIsTogglingScreen(false); }
  };

  const handleToggleBlur = async () => {
    if (isScreenSharing) {
        toast.error("please stop screen sharing first");
        return;
    }
    if (!isVideoEnabled && !isBlurEnabled) {
        toast.error("Please enable camera first");
        return;
    }

    setIsTogglingBlur(true);
    try {
        await toggleBackgroundBlur();
        toast.success(isBlurEnabled ? "blur off" : "blur on");
    } catch (error) {
        console.error(error);
    } finally {
        setIsTogglingBlur(false);
    }
  };

  const handleLeaveMeeting = () => {
    if (leaveRoom) leaveRoom();
    navigate('/dashboard');
    toast.success('you have left the meeting');
  };

  const handleEndMeeting = async () => {
    if (meeting && window.confirm('End meeting for all participants?')) {
      try {
        await dispatch(endMeetingAction(meeting.id)).unwrap();
        if (endMeetingSocket) endMeetingSocket();
        toast.success('Meeting ended');
        navigate('/dashboard');
      } catch (error) {
        toast.error('Error ending meeting');
      }
    }
  };

  const ControlBtn = ({ 
    active, danger, onClick, disabled, icon: Icon, activeIcon: ActiveIcon 
  }: any) => (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        relative p-4 rounded-full transition-all duration-300 shadow-lg backdrop-blur-sm border border-white/10
        ${danger 
          ? 'bg-red-500/80 hover:bg-red-600 text-white' 
          : active 
            ? 'bg-gray-800/80 hover:bg-gray-700 text-white' 
            : 'bg-red-500/80 hover:bg-red-600 text-white'
        }
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:scale-110'}
      `}
    >
      {disabled ? <Loader2 className="animate-spin" size={24} /> : (
        active ? <Icon size={24} /> : <ActiveIcon size={24} />
      )}
    </button>
  );

  return (
    <div className="fixed bottom-6 left-0 right-0 z-50 flex justify-center pointer-events-none">
      <div className="bg-gray-900/60 backdrop-blur-xl border border-white/10 px-6 py-4 rounded-2xl flex items-center gap-4 shadow-2xl pointer-events-auto">
        
        <ControlBtn 
          active={isAudioEnabled} 
          onClick={toggleAudio} 
          icon={Mic} activeIcon={MicOff} 
        />

        <ControlBtn 
          active={isVideoEnabled} 
          onClick={handleToggleVideo} 
          disabled={isTogglingVideo}
          icon={Video} activeIcon={VideoOff} 
        />

        {/* Blur Background Button */}
        <button
          onClick={handleToggleBlur}
          disabled={isTogglingBlur || isScreenSharing}
          title="Blur Background"
          className={`
            p-4 rounded-full transition-all shadow-lg backdrop-blur-sm border border-white/10
            ${isBlurEnabled ? 'bg-blue-600 text-white' : 'bg-gray-800/80 text-white hover:bg-gray-700'}
            ${(isTogglingBlur || isScreenSharing) ? 'opacity-50 cursor-not-allowed' : 'hover:scale-110'}
          `}
        >
          {isTogglingBlur ? <Loader2 className="animate-spin" size={24} /> : <Sparkles size={24} />}
        </button>

        <button
          onClick={handleToggleScreenShare}
          disabled={isTogglingScreen}
          className={`p-4 rounded-full transition-all shadow-lg backdrop-blur-sm border border-white/10 ${
            isScreenSharing ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-gray-800/80 text-white hover:bg-gray-700'
          }`}
        >
          {isTogglingScreen ? <Loader2 className="animate-spin" size={24} /> : 
            isScreenSharing ? <MonitorOff size={24} /> : <Monitor size={24} />
          }
        </button>

        <div className="w-px h-10 bg-white/20 mx-2"></div>

        <button 
          onClick={onOpenSettings}
          className="p-4 rounded-full bg-gray-800/80 hover:bg-gray-700 text-white shadow-lg backdrop-blur-sm border border-white/10 hover:scale-110 transition-all"
        >
          <Settings size={24} />
        </button>

        <button 
          onClick={isHost ? handleEndMeeting : handleLeaveMeeting} 
          className="px-6 py-4 rounded-full bg-red-600 hover:bg-red-700 text-white font-medium flex gap-2 items-center shadow-lg shadow-red-500/20 hover:scale-105 transition-all"
        >
          <PhoneOff size={24} />
          <span className="hidden sm:inline">{isHost ? 'End' : 'Leave'}</span>
        </button>
      </div>
    </div>
  );
};

export default MeetingControls;