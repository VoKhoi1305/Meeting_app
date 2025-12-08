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
//   toggleVideoTrack,
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

//   // Ref để ngăn chặn race condition khi khởi tạo stream
//   const isStartingRef = useRef(false);

//   // --- 1. Load danh sách thiết bị (Mic/Cam) ---
//   useEffect(() => {
//     let mounted = true;

//     const loadDevices = async () => {
//       try {
//         const { audioDevices, videoDevices } = await getMediaDevices();
        
//         if (mounted) {
//           dispatch(setAudioDevices(serializeDevices(audioDevices)));
//           dispatch(setVideoDevices(serializeDevices(videoDevices)));
//         }
//       } catch (error) {
//         console.error('Failed to load media devices:', error);
//       }
//     };

//     loadDevices();
//     navigator.mediaDevices.addEventListener('devicechange', loadDevices);

//     return () => {
//       mounted = false;
//       navigator.mediaDevices.removeEventListener('devicechange', loadDevices);
//     };
//   }, [dispatch]);

//   // --- 2. Bắt đầu Local Stream ---
//   const startLocalStream = useCallback(async () => {
//     if (isStartingRef.current) {
//       console.log('⏳ Stream is already starting...');
//       return localStream;
//     }

//     if (localStream && localStream.active) {
//       console.log('✅ Active stream already exists');
//       return localStream;
//     }

//     isStartingRef.current = true;
//     console.log('📹 Starting new local stream...');

//     try {
//       const stream = await getUserMedia();
      
//       console.log('✅ Got media stream:', {
//         id: stream.id,
//         audio: stream.getAudioTracks().length,
//         video: stream.getVideoTracks().length,
//       });

//       dispatch(setLocalStream(stream));
//       dispatch(setIsAudioEnabled(true));
//       dispatch(setIsVideoEnabled(true));
      
//       return stream;
//     } catch (error: any) {
//       console.error('❌ Error starting local stream:', error);
      
//       if (error.name === 'NotAllowedError') {
//         toast.error('Vui lòng cấp quyền truy cập Camera và Micro.');
//       } else if (error.name === 'NotFoundError') {
//         toast.error('Không tìm thấy thiết bị Camera hoặc Micro.');
//       } else {
//         toast.error('Không thể truy cập thiết bị media.');
//       }
      
//       throw error;
//     } finally {
//       isStartingRef.current = false;
//     }
//   }, [localStream, dispatch]);

//   // --- 3. Dừng Local Stream ---
//   const stopLocalStream = useCallback(() => {
//     console.log('🛑 Stopping local stream request...');
//     if (localStream) {
//       stopMediaStream(localStream);
//       dispatch(setLocalStream(null));
//       dispatch(setIsAudioEnabled(false));
//       dispatch(setIsVideoEnabled(false));
//       console.log('✅ Stream stopped and cleaned up');
//     }
//   }, [localStream, dispatch]);

//   // --- 4. Bật/Tắt Mic ---
//   const toggleAudio = useCallback(() => {
//     if (localStream) {
//       const newState = !isAudioEnabled;
//       console.log('🎤 Toggling audio:', newState);
//       toggleAudioTrack(localStream, newState);
//       dispatch(setIsAudioEnabled(newState));
//     }
//   }, [localStream, isAudioEnabled, dispatch]);


//   // --- 5. Bật/Tắt Video ---
// //   const toggleVideo = useCallback(async () => {
// //   console.log('🎬 toggleVideo called');
// //   console.log('Current state:', { isVideoEnabled, hasStream: !!localStream });

// //   if (!localStream) {
// //     console.warn('⚠️ No stream to toggle video');
// //     return;
// //   }

// //   const videoTracks = localStream.getVideoTracks();
// //   console.log('Video tracks:', {
// //     count: videoTracks.length,
// //     tracks: videoTracks.map(t => ({
// //       id: t.id,
// //       label: t.label,
// //       enabled: t.enabled,
// //       readyState: t.readyState,
// //       muted: t.muted,
// //     }))
// //   });
  
// //   if (isVideoEnabled) {

// //     console.log('📹 Turning OFF video');
// //     videoTracks.forEach((track) => {
// //       console.log(`Disabling track ${track.id}`);
// //       track.enabled = false;
// //     });
// //     dispatch(setIsVideoEnabled(false));

// //   } else {

    
// //     //const hasLiveTrack = videoTracks.some(track => track.readyState === 'live');
// //     const hasLiveTrack = videoTracks.some(track =>
// //     track.readyState === 'live' && track.kind === 'video');

// //     if (hasLiveTrack) {
// //       console.log('✅ Enabling existing video track');
// //       videoTracks.forEach((track) => {
// //         console.log(`Enabling track ${track.id}`);
// //         track.enabled = true;
// //       });
// //       dispatch(setIsVideoEnabled(true));
// //       console.log('✅ Video enabled (existing track)');
// //     } else {
// //       console.log('🔄 Video track is dead or missing, restarting camera...');
      
// //       try {
// //         // Get new video stream
// //         console.log('Requesting new video stream...');
// //         const newVideoStream = await navigator.mediaDevices.getUserMedia({
// //           video: {
// //             width: { ideal: 1280 },
// //             height: { ideal: 720 },
// //             frameRate: { ideal: 30 },
// //           },
// //         });
// //         console.log('✅ Got new video stream:', {
// //           id: newVideoStream.id,
// //           tracks: newVideoStream.getVideoTracks().length,
// //         });

// //         console.log('Removing old video tracks...');
// //         videoTracks.forEach((track) => {
// //           console.log(`Stopping and removing track ${track.id}`);
// //           track.stop();
// //           localStream.removeTrack(track);
// //         });

// //         // Add new video track
// //         const newVideoTrack = newVideoStream.getVideoTracks()[0];
// //         console.log('Adding new video track:', {
// //           id: newVideoTrack.id,
// //           label: newVideoTrack.label,
// //           readyState: newVideoTrack.readyState,
// //         });
// //         localStream.addTrack(newVideoTrack);

    
// //         console.log('Creating new stream reference...');
// //         const updatedStream = new MediaStream(localStream.getTracks());
// //         console.log('New stream created:', {
// //           id: updatedStream.id,
// //           audioTracks: updatedStream.getAudioTracks().length,
// //           videoTracks: updatedStream.getVideoTracks().length,
// //         });
        
// //         dispatch(setLocalStream(updatedStream));
// //         dispatch(setIsVideoEnabled(true));
        
// //         console.log('✅ Video track restarted successfully');
// //         toast.success('Camera đã được bật lại');
// //       } catch (error: any) {
// //         console.error('❌ Failed to restart video:', error);
// //         console.error('Error details:', {
// //           name: error.name,
// //           message: error.message,
// //         });
// //         toast.error('Không thể bật camera');
// //       }
// //     }
// //   }

// //   console.log('🏁 toggleVideo completed');
// // }, [localStream, isVideoEnabled, dispatch]);
// const toggleVideo = useCallback(async () => {
//   if (!localStream) return;

//   const videoTracks = localStream.getVideoTracks();

//   if (isVideoEnabled) {
//     // TURN OFF VIDEO
//     videoTracks.forEach(track => {
//       track.stop();               // quan trọng
//       localStream.removeTrack(track);
//     });

//     dispatch(setIsVideoEnabled(false));
//     return;
//   }

//   // TURN ON VIDEO
//   const activeTrack = videoTracks.find(t => t.readyState === "live");

//   if (activeTrack) {
//     // Không còn dùng track.enabled nữa — track.stop mới là đúng
//     activeTrack.enabled = true;
//     dispatch(setIsVideoEnabled(true));
//     return;
//   }

//   // NO LIVE TRACK → restart camera
//   try {
//     const newVideoStream = await navigator.mediaDevices.getUserMedia({ video: true });
//     const newTrack = newVideoStream.getVideoTracks()[0];

//     localStream.addTrack(newTrack);

//     const updated = new MediaStream(localStream.getTracks());
//     dispatch(setLocalStream(updated));
//     dispatch(setIsVideoEnabled(true));
//   } catch (err) {
//     console.error(err);
//     toast.error("Không thể bật lại camera");
//   }
// }, [localStream, isVideoEnabled]);

//   // --- 6. Chia sẻ màn hình ---
//   const startScreenShare = useCallback(async () => {
//     if (!localStream) {
//       console.error('No local stream to share screen (Need audio connection)');
//       return;
//     }

//     try {
//       const screenStream = await getDisplayMedia();

//       // Dừng video track của Camera hiện tại
//       localStream.getVideoTracks().forEach((track) => {
//         track.stop();
//         localStream.removeTrack(track);
//       });

//       // Lấy video track từ màn hình vừa share
//       const screenTrack = screenStream.getVideoTracks()[0];

//       // Xử lý khi người dùng ấn nút "Stop sharing" của trình duyệt
//       screenTrack.onended = async () => {
//         console.log('🖥️ Screen share ended by user via browser UI');
//         await stopScreenShare();
//       };

//       localStream.addTrack(screenTrack);

//       const newStreamReference = new MediaStream(localStream.getTracks());
      
//       dispatch(setLocalStream(newStreamReference));
//       dispatch(setIsScreenSharing(true));
//       dispatch(setIsVideoEnabled(true)); // Screen share counts as video enabled
      
//       console.log('✅ Screen sharing started');
//       toast.success('Đang chia sẻ màn hình');

//       return newStreamReference;
//     } catch (error: any) {
//       console.error('❌ Error starting screen share:', error);
//       if (error.name !== 'NotAllowedError') {
//         toast.error('Lỗi khi chia sẻ màn hình');
//       }
//     }
//   }, [localStream, dispatch]);

//   // --- 7. Dừng chia sẻ màn hình ---
//   const stopScreenShare = useCallback(async () => {
//     if (!localStream) return;

//     try {
//       console.log('🖥️ Stopping screen share, reverting to camera...');
      
//       // Dừng tất cả video tracks (là track màn hình)
//       localStream.getVideoTracks().forEach((track) => {
//         track.stop();
//         localStream.removeTrack(track);
//       });

//       // Lấy lại stream Camera
//       const cameraStream = await getUserMedia(); 
//       const videoTrack = cameraStream.getVideoTracks()[0];
      
//       if (videoTrack) {
//         localStream.addTrack(videoTrack);
//       }

//       // Tạo reference mới để trigger UI update
//       const restoredStream = new MediaStream(localStream.getTracks());

//       dispatch(setLocalStream(restoredStream));
//       dispatch(setIsScreenSharing(false));
//       dispatch(setIsVideoEnabled(true)); // Camera is back on
      
//       console.log('✅ Reverted to camera');
//       toast.success('Đã dừng chia sẻ màn hình');
      
//       return restoredStream;
//     } catch (error) {
//       console.error('❌ Error stopping screen share:', error);
//       toast.error('Không thể bật lại camera');
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
  toggleAudioTrack,
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
      console.error('Error:', error);
      toast.error('Không thể truy cập Camera/Micro');
    } finally {
      isStartingRef.current = false;
    }
  }, [localStream, dispatch]);

  const stopLocalStream = useCallback(() => {
    if (localStream) {
      stopMediaStream(localStream);
      dispatch(setLocalStream(null));
      dispatch(setIsScreenSharing(false));
    }
  }, [localStream, dispatch]);

  const toggleAudio = useCallback(() => {
    if (localStream) {
      const newState = !isAudioEnabled;
      toggleAudioTrack(localStream, newState);
      dispatch(setIsAudioEnabled(newState));
    }
  }, [localStream, isAudioEnabled, dispatch]);

  const toggleVideo = useCallback(async () => {
    if (!localStream) return;

    if (isVideoEnabled) {
      const videoTracks = localStream.getVideoTracks();
      videoTracks.forEach(track => {
        track.stop();
        localStream.removeTrack(track);
      });
      dispatch(setLocalStream(new MediaStream(localStream.getTracks())));
      dispatch(setIsVideoEnabled(false));
    } else {
      try {
        const newStream = await navigator.mediaDevices.getUserMedia({ video: true });
        const newVideoTrack = newStream.getVideoTracks()[0];
        localStream.addTrack(newVideoTrack);
        dispatch(setLocalStream(new MediaStream(localStream.getTracks())));
        dispatch(setIsVideoEnabled(true));
      } catch (err) {
        toast.error('Không thể bật camera');
      }
    }
  }, [localStream, isVideoEnabled, dispatch]);

  const startScreenShare = useCallback(async () => {
    if (!localStream) return;
    try {
      const screenStream = await getDisplayMedia();
      const screenTrack = screenStream.getVideoTracks()[0];

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

  const stopScreenShare = useCallback(async () => {
    if (!localStream) return;
    localStream.getVideoTracks().forEach(track => {
      track.stop();
      localStream.removeTrack(track);
    });

    try {
      const camStream = await getUserMedia();
      const camTrack = camStream.getVideoTracks()[0];
      if (camTrack) localStream.addTrack(camTrack);
      
      dispatch(setLocalStream(new MediaStream(localStream.getTracks())));
      dispatch(setIsScreenSharing(false));
      dispatch(setIsVideoEnabled(true));
    } catch (e) {
      console.error(e);
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