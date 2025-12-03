// import React, { useEffect, useRef } from 'react';
// import { Mic, MicOff, Video as VideoIcon, VideoOff, User } from 'lucide-react';

// interface VideoPlayerProps {
//   stream?: MediaStream;
//   displayName: string;
//   isAudioEnabled: boolean;
//   isVideoEnabled: boolean;
//   isMirrored?: boolean;
//   isLocal?: boolean;
// }

// const VideoPlayer: React.FC<VideoPlayerProps> = ({
//   stream,
//   displayName,
//   isAudioEnabled,
//   isVideoEnabled,
//   isMirrored = false,
//   isLocal = false,
// }) => {
//   const videoRef = useRef<HTMLVideoElement>(null);

//   useEffect(() => {
//     if (videoRef.current && stream) {
//       videoRef.current.srcObject = stream;
//     }
//   }, [stream]);

//   return (
//     <div className="relative w-full h-full bg-gray-900 rounded-lg overflow-hidden">
//       {/* Video element */}
//       {isVideoEnabled && stream ? (
//         <video
//           ref={videoRef}
//           autoPlay
//           playsInline
//           muted={isLocal}
//           className={`w-full h-full object-cover ${isMirrored ? 'scale-x-[-1]' : ''}`}
//         />
//       ) : (
//         <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-600 to-purple-600">
//           <User size={64} className="text-white" />
//         </div>
//       )}

//       {/* Overlay */}
//       <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

//       {/* Display name */}
//       <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/70 rounded text-white text-sm font-medium">
//         {displayName} {isLocal && '(You)'}
//       </div>

//       {/* Status indicators */}
//       <div className="absolute top-2 right-2 flex gap-1">
//         {!isAudioEnabled && (
//           <div className="p-1 bg-red-600 rounded-full">
//             <MicOff size={16} className="text-white" />
//           </div>
//         )}
//         {!isVideoEnabled && (
//           <div className="p-1 bg-red-600 rounded-full">
//             <VideoOff size={16} className="text-white" />
//           </div>
//         )}
//       </div>
//     </div>
//   );
// };

// export default VideoPlayer;

// src/components/video/VideoPlayer.tsx - FIXED
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

  // CRITICAL FIX: Update video element whenever stream changes
  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement) return;

    if (stream) {
      console.log(`🎥 Attaching stream to video element for ${displayName}`, {
        streamId: stream.id,
        tracks: stream.getTracks().length,
        videoTracks: stream.getVideoTracks().length,
      });

      // Always set srcObject, even if it's the "same" stream object
      // because the tracks inside may have changed
      videoElement.srcObject = stream;

      // Force play in case it was paused
      videoElement.play().catch((err) => {
        console.warn('Failed to play video:', err);
      });
    } else {
      console.log(`🎥 Removing stream from video element for ${displayName}`);
      videoElement.srcObject = null;
    }
  }, [stream, displayName]);

  // Additional effect to handle track changes
  useEffect(() => {
    if (!stream) return;

    const handleTrackChange = () => {
      console.log(`🔄 Track changed for ${displayName}`);
      // Force video element to refresh
      if (videoRef.current) {
        const currentSrc = videoRef.current.srcObject;
        videoRef.current.srcObject = null;
        videoRef.current.srcObject = currentSrc;
      }
    };

    // Listen for track events
    stream.getTracks().forEach((track) => {
      track.addEventListener('ended', handleTrackChange);
    });

    return () => {
      stream.getTracks().forEach((track) => {
        track.removeEventListener('ended', handleTrackChange);
      });
    };
  }, [stream, displayName]);

  return (
    <div className="relative w-full h-full bg-gray-900 rounded-lg overflow-hidden">
      {/* Video element */}
      {isVideoEnabled && stream && stream.getVideoTracks().length > 0 ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={isLocal}
          className={`w-full h-full object-cover ${isMirrored ? 'scale-x-[-1]' : ''}`}
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-600 to-purple-600">
          <User size={64} className="text-white" />
        </div>
      )}

      {/* Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

      {/* Display name */}
      <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/70 rounded text-white text-sm font-medium">
        {displayName} {isLocal && '(You)'}
      </div>

      {/* Status indicators */}
      <div className="absolute top-2 right-2 flex gap-1">
        {!isAudioEnabled && (
          <div className="p-1 bg-red-600 rounded-full">
            <MicOff size={16} className="text-white" />
          </div>
        )}
        {!isVideoEnabled && (
          <div className="p-1 bg-red-600 rounded-full">
            <VideoOff size={16} className="text-white" />
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoPlayer;