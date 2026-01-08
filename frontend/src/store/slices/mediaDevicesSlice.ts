
import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { MediaDevicesState, SerializableDeviceInfo } from '../../types/webrtc.types';

const initialState: MediaDevicesState = {
  audioDevices: [],
  videoDevices: [],
  selectedAudioDevice: null,
  selectedVideoDevice: null,
  localStream: null,
  isAudioEnabled: true,
  isVideoEnabled: true,
  isScreenSharing: false,
  isBlurEnabled: false, 
};

const mediaDevicesSlice = createSlice({
  name: 'mediaDevices',
  initialState,
  reducers: {
    setAudioDevices: (state, action: PayloadAction<SerializableDeviceInfo[]>) => {
      state.audioDevices = action.payload;
      
      if (action.payload.length > 0 && !state.selectedAudioDevice) {
        state.selectedAudioDevice = action.payload[0].deviceId;
      }
    },
    setVideoDevices: (state, action: PayloadAction<SerializableDeviceInfo[]>) => {
      state.videoDevices = action.payload;
      
      if (action.payload.length > 0 && !state.selectedVideoDevice) {
        state.selectedVideoDevice = action.payload[0].deviceId;
      }
    },
    setSelectedAudioDevice: (state, action: PayloadAction<string>) => {
      state.selectedAudioDevice = action.payload;
    },
    setSelectedVideoDevice: (state, action: PayloadAction<string>) => {
      state.selectedVideoDevice = action.payload;
    },
    setLocalStream: (state, action: PayloadAction<MediaStream | null>) => {
      state.localStream = action.payload;
    },
    setIsAudioEnabled: (state, action: PayloadAction<boolean>) => {
      state.isAudioEnabled = action.payload;
    },
    setIsVideoEnabled: (state, action: PayloadAction<boolean>) => {
      state.isVideoEnabled = action.payload;
    },
    setIsScreenSharing: (state, action: PayloadAction<boolean>) => {
      state.isScreenSharing = action.payload;
    },

    setIsBlurEnabled: (state, action: PayloadAction<boolean>) => {
      state.isBlurEnabled = action.payload;
    },
    toggleAudio: (state) => {
      state.isAudioEnabled = !state.isAudioEnabled;
    },
    toggleVideo: (state) => {
      state.isVideoEnabled = !state.isVideoEnabled;
    },
    resetMediaDevices: (state) => {
      state.localStream = null;
      state.isAudioEnabled = true;
      state.isVideoEnabled = true;
      state.isScreenSharing = false;
      state.isBlurEnabled = false;
    },
  },
});

export const {
  setAudioDevices,
  setVideoDevices,
  setSelectedAudioDevice,
  setSelectedVideoDevice,
  setLocalStream,
  setIsAudioEnabled,
  setIsVideoEnabled,
  setIsScreenSharing,
  setIsBlurEnabled,
  toggleAudio,
  toggleVideo,
  resetMediaDevices,
} = mediaDevicesSlice.actions;

export default mediaDevicesSlice.reducer;