// import { useEffect, useCallback, useRef } from 'react';
// import { useDispatch, useSelector } from 'react-redux';
// import type { RootState, AppDispatch } from '../store/store';
// import {
//   setLocalStream,
//   setIsAudioEnabled,
//   setIsVideoEnabled,
//   setIsScreenSharing,
//   setAudioDevices,
//   setVideoDevices,
// } from '../store/slices/mediaDevicesSlice';
// import {
//   getUserMedia,
//   getDisplayMedia,
//   getMediaDevices,
//   stopMediaStream,
//   toggleAudioTrack,
// } from '../utils/webrtc-utils';
// import toast from 'react-hot-toast';

// const serializeDevices = (devices: MediaDeviceInfo[]) => {
//   return devices.map((device) => ({
//     deviceId: device.deviceId,
//     kind: device.kind,
//     label: device.label,
//     groupId: device.groupId,
//   }));
// };

// export const useMediaStream = () => {
//   const dispatch = useDispatch<AppDispatch>();
//   const {
//     localStream,
//     isAudioEnabled,
//     isVideoEnabled,
//     isScreenSharing,
//   } = useSelector((state: RootState) => state.mediaDevices);

//   const isStartingRef = useRef(false);

//   useEffect(() => {
//     const loadDevices = async () => {
//       try {
//         const { audioDevices, videoDevices } = await getMediaDevices();
//         dispatch(setAudioDevices(serializeDevices(audioDevices)));
//         dispatch(setVideoDevices(serializeDevices(videoDevices)));
//       } catch (error) {
//         console.error('Failed to load media devices:', error);
//       }
//     };
//     loadDevices();
//   }, [dispatch]);

//   const startLocalStream = useCallback(async () => {
//     if (isStartingRef.current || (localStream && localStream.active)) return;
//     isStartingRef.current = true;
//     try {
//       const stream = await getUserMedia();
//       dispatch(setLocalStream(stream));
//       dispatch(setIsAudioEnabled(true));
//       dispatch(setIsVideoEnabled(true));
//       return stream;
//     } catch (error: any) {
//       console.error('Error:', error);
//       toast.error('Không thể truy cập Camera/Micro');
//     } finally {
//       isStartingRef.current = false;
//     }
//   }, [localStream, dispatch]);

//   const stopLocalStream = useCallback(() => {
//     if (localStream) {
//       stopMediaStream(localStream);
//       dispatch(setLocalStream(null));
//       dispatch(setIsScreenSharing(false));
//     }
//   }, [localStream, dispatch]);

//   const toggleAudio = useCallback(() => {
//     if (localStream) {
//       const newState = !isAudioEnabled;
//       toggleAudioTrack(localStream, newState);
//       dispatch(setIsAudioEnabled(newState));
//     }
//   }, [localStream, isAudioEnabled, dispatch]);

//   const toggleVideo = useCallback(async () => {
//     if (!localStream) return;

//     if (isVideoEnabled) {
//       const videoTracks = localStream.getVideoTracks();
//       videoTracks.forEach(track => {
//         track.stop();
//         localStream.removeTrack(track);
//       });
//       dispatch(setLocalStream(new MediaStream(localStream.getTracks())));
//       dispatch(setIsVideoEnabled(false));
//     } else {
//       try {
//         const newStream = await navigator.mediaDevices.getUserMedia({ video: true });
//         const newVideoTrack = newStream.getVideoTracks()[0];
//         localStream.addTrack(newVideoTrack);
//         dispatch(setLocalStream(new MediaStream(localStream.getTracks())));
//         dispatch(setIsVideoEnabled(true));
//       } catch (err) {
//         toast.error('Không thể bật camera');
//       }
//     }
//   }, [localStream, isVideoEnabled, dispatch]);

//   const startScreenShare = useCallback(async () => {
//     if (!localStream) return;
//     try {
//       const screenStream = await getDisplayMedia();
//       const screenTrack = screenStream.getVideoTracks()[0];

//       localStream.getVideoTracks().forEach(track => {
//         track.stop();
//         localStream.removeTrack(track);
//       });

//       localStream.addTrack(screenTrack);
      
//       screenTrack.onended = () => {
//         stopScreenShare();
//       };

//       dispatch(setLocalStream(new MediaStream(localStream.getTracks())));
//       dispatch(setIsScreenSharing(true));
//       dispatch(setIsVideoEnabled(true));
//     } catch (error) {
//       console.error('Error sharing screen:', error);
//     }
//   }, [localStream, dispatch]);

//   const stopScreenShare = useCallback(async () => {
//     if (!localStream) return;
//     localStream.getVideoTracks().forEach(track => {
//       track.stop();
//       localStream.removeTrack(track);
//     });

//     try {
//       const camStream = await getUserMedia();
//       const camTrack = camStream.getVideoTracks()[0];
//       if (camTrack) localStream.addTrack(camTrack);
      
//       dispatch(setLocalStream(new MediaStream(localStream.getTracks())));
//       dispatch(setIsScreenSharing(false));
//       dispatch(setIsVideoEnabled(true));
//     } catch (e) {
//       console.error(e);
//     }
//   }, [localStream, dispatch]);

//   return {
//     localStream,
//     isAudioEnabled,
//     isVideoEnabled,
//     isScreenSharing,
//     startLocalStream,
//     stopLocalStream,
//     toggleAudio,
//     toggleVideo,
//     startScreenShare,
//     stopScreenShare,
//   };
// };

import { useEffect, useCallback, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState, AppDispatch } from '../store/store';
import {
  setLocalStream,
  setIsAudioEnabled,
  setIsVideoEnabled,
  setIsScreenSharing,
  setAudioDevices,
  setVideoDevices,
} from '../store/slices/mediaDevicesSlice';
import {
  getUserMedia,
  getDisplayMedia,
  getMediaDevices,
  stopMediaStream,
} from '../utils/webrtc-utils';
import toast from 'react-hot-toast';

const serializeDevices = (devices: MediaDeviceInfo[]) => {
  return devices.map((device) => ({
    deviceId: device.deviceId,
    kind: device.kind,
    label: device.label,
    groupId: device.groupId,
  }));
};

export const useMediaStream = () => {
  const dispatch = useDispatch<AppDispatch>();
  const {
    localStream,
    isAudioEnabled,
    isVideoEnabled,
    isScreenSharing,
  } = useSelector((state: RootState) => state.mediaDevices);

  const isStartingRef = useRef(false);

  // Load devices
  useEffect(() => {
    const loadDevices = async () => {
      try {
        const { audioDevices, videoDevices } = await getMediaDevices();
        dispatch(setAudioDevices(serializeDevices(audioDevices)));
        dispatch(setVideoDevices(serializeDevices(videoDevices)));
      } catch (error) {
        console.error('Failed to load media devices:', error);
      }
    };
    loadDevices();
  }, [dispatch]);

  // Start Stream
  const startLocalStream = useCallback(async () => {
    if (isStartingRef.current || (localStream && localStream.active)) return;
    isStartingRef.current = true;
    try {
      const stream = await getUserMedia();
      dispatch(setLocalStream(stream));
      dispatch(setIsAudioEnabled(true));
      dispatch(setIsVideoEnabled(true));
      return stream;
    } catch (error: any) {
      console.error('Error starting stream:', error);
      toast.error('Không thể truy cập Camera/Micro');
    } finally {
      isStartingRef.current = false;
    }
  }, [localStream, dispatch]);

  // Stop Stream
  const stopLocalStream = useCallback(() => {
    if (localStream) {
      stopMediaStream(localStream);
      dispatch(setLocalStream(null));
      dispatch(setIsScreenSharing(false));
    }
  }, [localStream, dispatch]);

  // Toggle Audio (Soft Toggle)
  const toggleAudio = useCallback(() => {
    if (localStream) {
      const newState = !isAudioEnabled;
      localStream.getAudioTracks().forEach(track => { track.enabled = newState; });
      dispatch(setIsAudioEnabled(newState));
    }
  }, [localStream, isAudioEnabled, dispatch]);

  // Toggle Video (Soft Toggle & Restart Logic)
  const toggleVideo = useCallback(async () => {
    // Nếu chưa có stream (vd: vào phòng nhưng từ chối cam trước đó), thử start lại
    if (!localStream) {
      if (!isVideoEnabled) await startLocalStream();
      return;
    }

    if (isVideoEnabled) {
      // TẮT VIDEO: Chỉ set enabled = false để gửi màn hình đen (giữ kết nối)
      localStream.getVideoTracks().forEach(track => { track.enabled = false; });
      dispatch(setIsVideoEnabled(false));
    } else {
      // BẬT VIDEO
      const videoTracks = localStream.getVideoTracks();
      if (videoTracks.length > 0) {
        // Track còn đó, chỉ cần bật lại
        videoTracks.forEach(track => { track.enabled = true; });
        dispatch(setIsVideoEnabled(true));
      } else {
        // Track đã bị stop hoặc mất (do share screen), xin cấp lại track mới
        try {
          const newStream = await getUserMedia();
          const newVideoTrack = newStream.getVideoTracks()[0];
          
          if (newVideoTrack) {
            localStream.addTrack(newVideoTrack);
            // Dispatch tạo reference mới để useWebRTC nhận biết thay đổi
            dispatch(setLocalStream(new MediaStream(localStream.getTracks())));
            dispatch(setIsVideoEnabled(true));
          }
        } catch (err) {
          toast.error('Không thể bật lại camera');
        }
      }
    }
  }, [localStream, isVideoEnabled, dispatch, startLocalStream]);

  // Share Screen
  const startScreenShare = useCallback(async () => {
    if (!localStream) return;
    try {
      const screenStream = await getDisplayMedia();
      const screenTrack = screenStream.getVideoTracks()[0];

      // Tạm tắt camera track (không stop, chỉ enabled=false nếu muốn giữ, hoặc stop nếu muốn tiết kiệm)
      // Ở đây stop để nhường quyền ưu tiên cho screen
      localStream.getVideoTracks().forEach(track => {
        track.stop();
        localStream.removeTrack(track);
      });

      localStream.addTrack(screenTrack);
      
      screenTrack.onended = () => {
        stopScreenShare();
      };

      dispatch(setLocalStream(new MediaStream(localStream.getTracks())));
      dispatch(setIsScreenSharing(true));
      dispatch(setIsVideoEnabled(true));
    } catch (error) {
      console.error('Error sharing screen:', error);
    }
  }, [localStream, dispatch]);

  // Stop Share Screen
  const stopScreenShare = useCallback(async () => {
    if (!localStream) return;
    
    // Stop screen track
    localStream.getVideoTracks().forEach(track => {
      track.stop();
      localStream.removeTrack(track);
    });

    // Lấy lại Camera
    try {
      const camStream = await getUserMedia();
      const camTrack = camStream.getVideoTracks()[0];
      if (camTrack) localStream.addTrack(camTrack);
      
      dispatch(setLocalStream(new MediaStream(localStream.getTracks())));
      dispatch(setIsScreenSharing(false));
      dispatch(setIsVideoEnabled(true));
    } catch (e) {
      console.error('Error reverting to camera:', e);
    }
  }, [localStream, dispatch]);

  return {
    localStream,
    isAudioEnabled,
    isVideoEnabled,
    isScreenSharing,
    startLocalStream,
    stopLocalStream,
    toggleAudio,
    toggleVideo,
    startScreenShare,
    stopScreenShare,
  };
};