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
  
  const {
    localStream,
    isAudioEnabled,
    isVideoEnabled,
    isScreenSharing,
    isBlurEnabled,
  } = useSelector((state: RootState) => state.mediaDevices);

  const isStartingRef = useRef(false);
  const rawVideoRef = useRef<MediaStream | null>(null); 

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
      rawVideoRef.current = stream; 

      let finalStream = stream;
      
      if (isBlurEnabled) {
        try {
            const processor = BackgroundProcessor.getInstance();
            finalStream = await processor.startProcessing(stream);
        } catch (e) {
            console.error("Failed to start background blur", e);
            toast.error("Failed to start background blur ");
        }
      }

      dispatch(setLocalStream(finalStream));
      dispatch(setIsAudioEnabled(true));
      dispatch(setIsVideoEnabled(true));
      return finalStream;
    } catch (error: any) {
      console.error('Error starting stream:', error);
      toast.error('cannot access camera/microphone. Please check permissions.');
    } finally {
      isStartingRef.current = false;
    }
  }, [localStream, isBlurEnabled, dispatch]);

  const toggleBackgroundBlur = useCallback(async () => {
    const newBlurState = !isBlurEnabled;
    dispatch(setIsBlurEnabled(newBlurState));

    if (!localStream || !isVideoEnabled) return;

    try {
        const processor = BackgroundProcessor.getInstance();
        let newStream: MediaStream;

        if (newBlurState) {
            let sourceStream = rawVideoRef.current;
            if (!sourceStream || !sourceStream.active) {
                 sourceStream = await getUserMedia();
                 rawVideoRef.current = sourceStream;
            }
            newStream = await processor.startProcessing(sourceStream);
        } else {
            processor.stopProcessing();
            if (rawVideoRef.current && rawVideoRef.current.active) {
                newStream = rawVideoRef.current;
            } else {
                newStream = await getUserMedia();
                rawVideoRef.current = newStream;
            }
        }

        const audioTrack = localStream.getAudioTracks()[0];
        if (audioTrack && newStream.getAudioTracks().length === 0) {
            newStream.addTrack(audioTrack);
        }

        dispatch(setLocalStream(newStream));

    } catch (error) {
        console.error("Error toggling blur:", error);
        toast.error("error toggling background blur");
        dispatch(setIsBlurEnabled(!newBlurState)); 
    }

  }, [isBlurEnabled, localStream, isVideoEnabled, dispatch]);

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

  const toggleAudio = useCallback(() => {
    if (localStream) {
      const newState = !isAudioEnabled;
      localStream.getAudioTracks().forEach((track: MediaStreamTrack) => { track.enabled = newState; });
      dispatch(setIsAudioEnabled(newState));
    }
  }, [localStream, isAudioEnabled, dispatch]);

  const toggleVideo = useCallback(async () => {
    if (!localStream) {
      if (!isVideoEnabled) await startLocalStream();
      return;
    }

    if (isVideoEnabled) {
      localStream.getVideoTracks().forEach((track: MediaStreamTrack) => { track.enabled = false; });
      dispatch(setIsVideoEnabled(false));
    } else {
      const videoTracks = localStream.getVideoTracks();
      if (videoTracks.length > 0 && videoTracks[0].readyState === 'live') {
        videoTracks.forEach((track: MediaStreamTrack) => { track.enabled = true; });
        dispatch(setIsVideoEnabled(true));
      } else {
        await stopLocalStream();
        await startLocalStream();
      }
    }
  }, [localStream, isVideoEnabled, dispatch, startLocalStream, stopLocalStream]);

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