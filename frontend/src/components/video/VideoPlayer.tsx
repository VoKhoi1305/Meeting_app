import React, { useEffect, useRef } from 'react';
import { Mic, MicOff, Video as VideoIcon, VideoOff, User } from 'lucide-react';

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

    if (stream) {
      videoElement.srcObject = stream;
      // FIX: Bắt lỗi AbortError
      videoElement.play().catch((err) => {
        if (err.name !== 'AbortError') {
            console.warn('Video play failed:', err);
        }
      });
    } else {
      videoElement.srcObject = null;
    }
  }, [stream]);

  // Kiểm tra có track video thực sự không
  const hasVideoTrack = stream && stream.getVideoTracks().length > 0;
  // Chỉ hiện video nếu: Người dùng bật cam VÀ Stream có track video
  const shouldShowVideo = isVideoEnabled && hasVideoTrack;

  return (
    <div className="relative w-full h-full bg-gray-900 rounded-lg overflow-hidden border border-gray-800">
      {shouldShowVideo ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={isLocal} // Quan trọng: Mute local để tránh hú
          className={`w-full h-full object-cover ${isMirrored ? 'scale-x-[-1]' : ''}`}
        />
      ) : (
        // Avatar view
        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
          <div className="w-24 h-24 rounded-full bg-blue-600 flex items-center justify-center">
             <span className="text-3xl font-bold text-white uppercase">
                {displayName?.charAt(0) || <User size={40} />}
             </span>
          </div>
        </div>
      )}

      {/* Overlay Tên */}
      <div className="absolute bottom-3 left-3 px-3 py-1 bg-black/60 rounded-full text-white text-sm font-medium backdrop-blur-sm">
        {displayName} {isLocal && '(You)'}
      </div>

      {/* Status Icons */}
      <div className="absolute top-3 right-3 flex gap-2">
        {!isAudioEnabled && (
          <div className="p-1.5 bg-red-500/90 rounded-full backdrop-blur-sm">
            <MicOff size={16} className="text-white" />
          </div>
        )}
        {!isVideoEnabled && (
          <div className="p-1.5 bg-red-500/90 rounded-full backdrop-blur-sm">
            <VideoOff size={16} className="text-white" />
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoPlayer;