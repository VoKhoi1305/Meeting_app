
import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
// Nhớ import SerializableDeviceInfo vừa tạo ở bước 1
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
};

const mediaDevicesSlice = createSlice({
  name: 'mediaDevices',
  initialState,
  reducers: {
    // 👇 ĐÃ SỬA: Dùng SerializableDeviceInfo[] thay vì MediaDeviceInfo[]
    setAudioDevices: (state, action: PayloadAction<SerializableDeviceInfo[]>) => {
      state.audioDevices = action.payload;
      // Tự động chọn thiết bị đầu tiên nếu chưa chọn cái nào
      if (action.payload.length > 0 && !state.selectedAudioDevice) {
        state.selectedAudioDevice = action.payload[0].deviceId;
      }
    },
    // 👇 ĐÃ SỬA: Dùng SerializableDeviceInfo[] thay vì MediaDeviceInfo[]
    setVideoDevices: (state, action: PayloadAction<SerializableDeviceInfo[]>) => {
      state.videoDevices = action.payload;
      // Tự động chọn thiết bị đầu tiên nếu chưa chọn cái nào
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
    // Lưu ý: MediaStream vẫn là non-serializable, 
    // Redux sẽ cảnh báo ở đây nhưng nếu bắt buộc phải lưu stream vào Redux thì đành chấp nhận (ignore check)
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
  toggleAudio,
  toggleVideo,
  resetMediaDevices,
} = mediaDevicesSlice.actions;

export default mediaDevicesSlice.reducer;