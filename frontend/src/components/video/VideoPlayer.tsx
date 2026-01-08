import React, { useEffect, useRef } from 'react';
import { MicOff, VideoOff, User } from 'lucide-react';

interface VideoPlayerProps {
  stream?: MediaStream;
  displayName: string;
  isAudioEnabled: boolean;
  isVideoEnabled: boolean;
  isMirrored?: boolean;
  isLocal?: boolean;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({
  stream,
  displayName,
  isAudioEnabled,
  isVideoEnabled, 
  isMirrored = false,
  isLocal = false,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement) return;

    if (stream && isVideoEnabled) {
      videoElement.srcObject = stream;
      videoElement.play().catch((err) => {
        if (err.name !== 'AbortError') console.warn('Video play failed:', err);
      });
    } else {
      videoElement.srcObject = null;
    }
  }, [stream, isVideoEnabled]); 
  const shouldShowVideo = isVideoEnabled && stream && stream.getVideoTracks().length > 0;

  return (
    <div className="relative w-full h-full bg-gray-900 rounded-lg overflow-hidden border border-gray-800">
      
      {/*LAYER VIDEO */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={isLocal} 
        className={`w-full h-full object-cover ${isMirrored ? 'scale-x-[-1]' : ''} ${shouldShowVideo ? 'block' : 'hidden'}`}
      />

      {/*LAYER AVATAR */}
      {!shouldShowVideo && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
          <div className="w-24 h-24 rounded-full bg-blue-600 flex items-center justify-center shadow-lg ring-4 ring-blue-500/30">
             <span className="text-3xl font-bold text-white uppercase select-none">
                {displayName?.charAt(0).toUpperCase() || <User size={40} />}
             </span>
          </div>
        </div>
      )}

      {/*OVERLAY INFO */}
      <div className="absolute bottom-3 left-3 px-3 py-1 bg-black/60 rounded-full text-white text-sm font-medium backdrop-blur-sm z-10">
        {displayName} {isLocal && '(You)'}
      </div>

      {/* STATUS ICONS */}
      <div className="absolute top-3 right-3 flex gap-2 z-10">
        {!isAudioEnabled && (
          <div className="p-1.5 bg-red-500/90 rounded-full backdrop-blur-sm shadow-sm">
            <MicOff size={16} className="text-white" />
          </div>
        )}
        {!isVideoEnabled && (
          <div className="p-1.5 bg-red-500/90 rounded-full backdrop-blur-sm shadow-sm">
            <VideoOff size={16} className="text-white" />
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoPlayer;