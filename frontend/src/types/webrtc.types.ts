export interface PeerConnection {
  peerId: string;
  connection: RTCPeerConnection;
  stream?: MediaStream;
}

export interface SerializableDeviceInfo {
  deviceId: string;
  kind: MediaDeviceKind | string;
  label: string;
  groupId: string;
}

export interface MediaDevicesState {
  audioDevices: SerializableDeviceInfo[]; 
  videoDevices: SerializableDeviceInfo[]; 
  selectedAudioDevice: string | null;
  selectedVideoDevice: string | null;
  localStream: MediaStream | null;
  isAudioEnabled: boolean;
  isVideoEnabled: boolean;
  isScreenSharing: boolean;
  isBlurEnabled: boolean;
}

export interface SignalData {
  type: 'offer' | 'answer';
  sdp: string;
}

export interface IceCandidate {
  candidate: string;
  sdpMid: string | null;
  sdpMLineIndex: number | null;
}