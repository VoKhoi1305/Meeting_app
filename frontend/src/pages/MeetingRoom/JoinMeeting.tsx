import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState, AppDispatch } from '../../store/store';
import { getMeetingByRoomId } from '../../store/slices/meetingSlice';
import { useMediaStream } from '../../hooks/useMediaStream';
import Button from '../../components/common/Button';
import Loading from '../../components/common/Loading';
import { Video, VideoOff, Mic, MicOff } from 'lucide-react';

const JoinMeeting: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  
  const { user } = useSelector((state: RootState) => state.auth);
  const { current: meeting, loading } = useSelector(
    (state: RootState) => state.meeting
  );
  const { localStream, isAudioEnabled, isVideoEnabled } = useSelector(
    (state: RootState) => state.mediaDevices
  );

  const {
    startLocalStream,
    stopLocalStream,
    toggleAudio,
    toggleVideo,
  } = useMediaStream();

  const [videoRef, setVideoRef] = useState<HTMLVideoElement | null>(null);
  const [isJoining, setIsJoining] = useState(false);

  useEffect(() => {
    if (roomId) {
      dispatch(getMeetingByRoomId(roomId));
    }
  }, [roomId, dispatch]);

  useEffect(() => {
    console.log('Starting preview stream...');
    startLocalStream().catch((error) => {
      console.error('Failed to start preview:', error);
    });
    
    return () => {
      console.log('Cleaning up preview stream');
      stopLocalStream();
    };
  }, [startLocalStream, stopLocalStream]);

  useEffect(() => {
    if (videoRef && localStream) {
      videoRef.srcObject = localStream;
    }
  }, [videoRef, localStream]);

  const handleJoin = async () => {
    if (!meeting || !roomId) {
      console.error('Cannot join: missing meeting or roomId');
      return;
    }

    setIsJoining(true);
    console.log('Joining meeting...', { roomId, meetingId: meeting.id });

    try {
      await new Promise(resolve => setTimeout(resolve, 300));
      navigate(`/meeting/${roomId}`, { 
        replace: true,
        state: { fromPreview: true }
      });
    } catch (error) {
      console.error('Error navigating to meeting:', error);
      setIsJoining(false);
    }
  };

  const handleCancel = () => {
    stopLocalStream();
    navigate('/dashboard');
  };

  if (loading) {
    return <Loading />;
  }

  if (!meeting) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Meeting not found
          </h2>
          <Button onClick={() => navigate('/dashboard')}>
            Go to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full bg-white rounded-lg shadow-xl overflow-hidden">
        <div className="p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {meeting.title}
          </h1>
          <p className="text-gray-600 mb-6">
            Ready to join? Check your camera and microphone
          </p>

          {/* Preview */}
          <div className="aspect-video bg-gray-900 rounded-lg overflow-hidden mb-6 relative">
            {isVideoEnabled && localStream ? (
              <video
                ref={setVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover scale-x-[-1]"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-600 to-purple-600">
                <VideoOff size={64} className="text-white" />
              </div>
            )}

            {/* Preview Controls */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-4">
              <button
                onClick={toggleAudio}
                className={`p-4 rounded-full transition ${
                  isAudioEnabled
                    ? 'bg-gray-700 hover:bg-gray-600'
                    : 'bg-red-600 hover:bg-red-700'
                }`}
                title={isAudioEnabled ? 'Mute' : 'Unmute'}
              >
                {isAudioEnabled ? (
                  <Mic className="text-white" size={24} />
                ) : (
                  <MicOff className="text-white" size={24} />
                )}
              </button>

              <button
                onClick={toggleVideo}
                className={`p-4 rounded-full transition ${
                  isVideoEnabled
                    ? 'bg-gray-700 hover:bg-gray-600'
                    : 'bg-red-600 hover:bg-red-700'
                }`}
                title={isVideoEnabled ? 'Stop Video' : 'Start Video'}
              >
                {isVideoEnabled ? (
                  <Video className="text-white" size={24} />
                ) : (
                  <VideoOff className="text-white" size={24} />
                )}
              </button>
            </div>
          </div>

          {/* User Info */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Joining as
            </label>
            <div className="px-4 py-3 bg-gray-50 rounded-lg">
              <p className="font-medium text-gray-900">{user?.fullName}</p>
              <p className="text-sm text-gray-600">{user?.email}</p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-4">
            <Button 
              onClick={handleJoin} 
              className="flex-1"
              loading={isJoining}
              disabled={!localStream}
            >
              {isJoining ? 'Joining...' : 'Join Now'}
            </Button>
            <Button
              onClick={handleCancel}
              variant="secondary"
              className="flex-1"
              disabled={isJoining}
            >
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JoinMeeting;