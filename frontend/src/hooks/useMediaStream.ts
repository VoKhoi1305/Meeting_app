
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

//   // Load devices
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

//   // Start Stream
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
//       console.error('Error starting stream:', error);
//       toast.error('Không thể truy cập Camera/Micro');
//     } finally {
//       isStartingRef.current = false;
//     }
//   }, [localStream, dispatch]);

//   // Stop Stream
//   const stopLocalStream = useCallback(() => {
//     if (localStream) {
//       stopMediaStream(localStream);
//       dispatch(setLocalStream(null));
//       dispatch(setIsScreenSharing(false));
//     }
//   }, [localStream, dispatch]);

//   // Toggle Audio (Soft Toggle)
//   const toggleAudio = useCallback(() => {
//     if (localStream) {
//       const newState = !isAudioEnabled;
//       localStream.getAudioTracks().forEach(track => { track.enabled = newState; });
//       dispatch(setIsAudioEnabled(newState));
//     }
//   }, [localStream, isAudioEnabled, dispatch]);

//   // Toggle Video (Soft Toggle & Restart Logic)
//   const toggleVideo = useCallback(async () => {
//     // Nếu chưa có stream (vd: vào phòng nhưng từ chối cam trước đó), thử start lại
//     if (!localStream) {
//       if (!isVideoEnabled) await startLocalStream();
//       return;
//     }

//     if (isVideoEnabled) {
//       // TẮT VIDEO: Chỉ set enabled = false để gửi màn hình đen (giữ kết nối)
//       localStream.getVideoTracks().forEach(track => { track.enabled = false; });
//       dispatch(setIsVideoEnabled(false));
//     } else {
//       // BẬT VIDEO
//       const videoTracks = localStream.getVideoTracks();
//       if (videoTracks.length > 0) {
//         // Track còn đó, chỉ cần bật lại
//         videoTracks.forEach(track => { track.enabled = true; });
//         dispatch(setIsVideoEnabled(true));
//       } else {
//         // Track đã bị stop hoặc mất (do share screen), xin cấp lại track mới
//         try {
//           const newStream = await getUserMedia();
//           const newVideoTrack = newStream.getVideoTracks()[0];
          
//           if (newVideoTrack) {
//             localStream.addTrack(newVideoTrack);
//             // Dispatch tạo reference mới để useWebRTC nhận biết thay đổi
//             dispatch(setLocalStream(new MediaStream(localStream.getTracks())));
//             dispatch(setIsVideoEnabled(true));
//           }
//         } catch (err) {
//           toast.error('Không thể bật lại camera');
//         }
//       }
//     }
//   }, [localStream, isVideoEnabled, dispatch, startLocalStream]);

//   // Share Screen
//   const startScreenShare = useCallback(async () => {
//     if (!localStream) return;
//     try {
//       const screenStream = await getDisplayMedia();
//       const screenTrack = screenStream.getVideoTracks()[0];

//       // Tạm tắt camera track (không stop, chỉ enabled=false nếu muốn giữ, hoặc stop nếu muốn tiết kiệm)
//       // Ở đây stop để nhường quyền ưu tiên cho screen
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

//   // Stop Share Screen
//   const stopScreenShare = useCallback(async () => {
//     if (!localStream) return;
    
//     // Stop screen track
//     localStream.getVideoTracks().forEach(track => {
//       track.stop();
//       localStream.removeTrack(track);
//     });

//     // Lấy lại Camera
//     try {
//       const camStream = await getUserMedia();
//       const camTrack = camStream.getVideoTracks()[0];
//       if (camTrack) localStream.addTrack(camTrack);
      
//       dispatch(setLocalStream(new MediaStream(localStream.getTracks())));
//       dispatch(setIsScreenSharing(false));
//       dispatch(setIsVideoEnabled(true));
//     } catch (e) {
//       console.error('Error reverting to camera:', e);
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
  setIsBlurEnabled,
} from '../store/slices/mediaDevicesSlice';
import {
  getUserMedia,
  getDisplayMedia,
  getMediaDevices,
  stopMediaStream,
} from '../utils/webrtc-utils';
import { BackgroundProcessor } from '../utils/background-processing';
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
  
  // SỬA LỖI: Xóa 'as any' để TypeScript hiểu đúng kiểu dữ liệu từ RootState
  const {
    localStream,
    isAudioEnabled,
    isVideoEnabled,
    isScreenSharing,
    isBlurEnabled,
  } = useSelector((state: RootState) => state.mediaDevices);

  const isStartingRef = useRef(false);
  const rawVideoRef = useRef<MediaStream | null>(null); // Lưu stream gốc của camera

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
      rawVideoRef.current = stream; // Lưu bản gốc

      let finalStream = stream;
      
      // Nếu đang bật blur thì xử lý qua AI
      if (isBlurEnabled) {
        try {
            const processor = BackgroundProcessor.getInstance();
            finalStream = await processor.startProcessing(stream);
        } catch (e) {
            console.error("Failed to start background blur", e);
            toast.error("Không thể bật làm mờ nền");
        }
      }

      dispatch(setLocalStream(finalStream));
      dispatch(setIsAudioEnabled(true));
      dispatch(setIsVideoEnabled(true));
      return finalStream;
    } catch (error: any) {
      console.error('Error starting stream:', error);
      toast.error('Không thể truy cập Camera/Micro');
    } finally {
      isStartingRef.current = false;
    }
  }, [localStream, isBlurEnabled, dispatch]);

  // Toggle Background Blur (Hàm xử lý bật/tắt làm mờ)
  const toggleBackgroundBlur = useCallback(async () => {
    const newBlurState = !isBlurEnabled;
    dispatch(setIsBlurEnabled(newBlurState));

    if (!localStream || !isVideoEnabled) return;

    try {
        const processor = BackgroundProcessor.getInstance();
        let newStream: MediaStream;

        if (newBlurState) {
            // BẬT: Lấy stream gốc đưa vào AI
            let sourceStream = rawVideoRef.current;
            if (!sourceStream || !sourceStream.active) {
                 sourceStream = await getUserMedia();
                 rawVideoRef.current = sourceStream;
            }
            newStream = await processor.startProcessing(sourceStream);
        } else {
            // TẮT: Dừng AI, dùng lại stream gốc
            processor.stopProcessing();
            if (rawVideoRef.current && rawVideoRef.current.active) {
                newStream = rawVideoRef.current;
            } else {
                newStream = await getUserMedia();
                rawVideoRef.current = newStream;
            }
        }

        // Giữ lại audio track
        const audioTrack = localStream.getAudioTracks()[0];
        if (audioTrack && newStream.getAudioTracks().length === 0) {
            newStream.addTrack(audioTrack);
        }

        dispatch(setLocalStream(newStream));

    } catch (error) {
        console.error("Error toggling blur:", error);
        toast.error("Lỗi khi chuyển chế độ nền");
        dispatch(setIsBlurEnabled(!newBlurState)); // Revert nếu lỗi
    }

  }, [isBlurEnabled, localStream, isVideoEnabled, dispatch]);

  // Stop Stream
  const stopLocalStream = useCallback(() => {
    if (localStream) {
      stopMediaStream(localStream);
      BackgroundProcessor.getInstance().stopProcessing();
      if (rawVideoRef.current) {
          stopMediaStream(rawVideoRef.current);
          rawVideoRef.current = null;
      }
      dispatch(setLocalStream(null));
      dispatch(setIsScreenSharing(false));
    }
  }, [localStream, dispatch]);

  // Toggle Audio
  const toggleAudio = useCallback(() => {
    if (localStream) {
      const newState = !isAudioEnabled;
      // Thêm type tường minh: (track: MediaStreamTrack)
      localStream.getAudioTracks().forEach((track: MediaStreamTrack) => { track.enabled = newState; });
      dispatch(setIsAudioEnabled(newState));
    }
  }, [localStream, isAudioEnabled, dispatch]);

  // Toggle Video
  const toggleVideo = useCallback(async () => {
    if (!localStream) {
      if (!isVideoEnabled) await startLocalStream();
      return;
    }

    if (isVideoEnabled) {
      // TẮT VIDEO
      localStream.getVideoTracks().forEach((track: MediaStreamTrack) => { track.enabled = false; });
      dispatch(setIsVideoEnabled(false));
    } else {
      // BẬT VIDEO
      const videoTracks = localStream.getVideoTracks();
      if (videoTracks.length > 0 && videoTracks[0].readyState === 'live') {
        videoTracks.forEach((track: MediaStreamTrack) => { track.enabled = true; });
        dispatch(setIsVideoEnabled(true));
      } else {
        // Nếu track đã mất, khởi động lại stream
        await stopLocalStream();
        await startLocalStream();
      }
    }
  }, [localStream, isVideoEnabled, dispatch, startLocalStream, stopLocalStream]);

  // Share Screen (Khai báo trước để dùng trong logic)
  // Lưu ý: stopScreenShare được gọi trong callback nên không cần dependency trực tiếp ở đây để tránh vòng lặp
  const stopScreenShareRef = useRef<() => void>(() => {});

  const startScreenShare = useCallback(async () => {
    if (!localStream) return;
    try {
      const screenStream = await getDisplayMedia();
      const screenTrack = screenStream.getVideoTracks()[0];

      if (isBlurEnabled) {
          BackgroundProcessor.getInstance().stopProcessing();
      }

      localStream.getVideoTracks().forEach((track: MediaStreamTrack) => {
        track.stop();
        localStream.removeTrack(track);
      });

      localStream.addTrack(screenTrack);
      
      screenTrack.onended = () => {
        // Gọi hàm stop thông qua ref để tránh lỗi dependency
        stopScreenShareRef.current();
      };

      dispatch(setLocalStream(new MediaStream(localStream.getTracks())));
      dispatch(setIsScreenSharing(true));
      dispatch(setIsVideoEnabled(true));
    } catch (error) {
      console.error('Error sharing screen:', error);
    }
  }, [localStream, dispatch, isBlurEnabled]);

  const stopScreenShare = useCallback(async () => {
    if (!localStream) return;
    
    localStream.getVideoTracks().forEach((track: MediaStreamTrack) => {
      track.stop();
      localStream.removeTrack(track);
    });

    try {
      let camStream: MediaStream;
      
      if (isBlurEnabled) {
           let source = rawVideoRef.current;
           if (!source || !source.active) {
               source = await getUserMedia();
               rawVideoRef.current = source;
           }
           camStream = await BackgroundProcessor.getInstance().startProcessing(source);
      } else {
          camStream = await getUserMedia();
          rawVideoRef.current = camStream;
      }

      const camTrack = camStream.getVideoTracks()[0];
      if (camTrack) localStream.addTrack(camTrack);
      
      dispatch(setLocalStream(new MediaStream(localStream.getTracks())));
      dispatch(setIsScreenSharing(false));
      dispatch(setIsVideoEnabled(true));
    } catch (e) {
      console.error('Error reverting to camera:', e);
    }
  }, [localStream, dispatch, isBlurEnabled]);

  // Cập nhật ref mỗi khi hàm thay đổi
  useEffect(() => {
    stopScreenShareRef.current = stopScreenShare;
  }, [stopScreenShare]);

  return {
    localStream,
    isAudioEnabled,
    isVideoEnabled,
    isScreenSharing,
    isBlurEnabled,
    startLocalStream,
    stopLocalStream,
    toggleAudio,
    toggleVideo,
    startScreenShare,
    stopScreenShare,
    toggleBackgroundBlur,
  };
};