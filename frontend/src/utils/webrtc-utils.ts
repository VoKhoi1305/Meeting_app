import { ICE_SERVERS, MEDIA_CONSTRAINTS, SCREEN_SHARE_CONSTRAINTS } from '../constants/webrtc.constants';

export async function getUserMedia(): Promise<MediaStream> {
  try {
    const stream = await navigator.mediaDevices.getUserMedia(MEDIA_CONSTRAINTS);
    return stream;
  } catch (error) {
    console.error('Error accessing media devices:', error);
    throw error;
  }
}

export async function getDisplayMedia(): Promise<MediaStream> {
  try {
    const stream = await navigator.mediaDevices.getDisplayMedia(SCREEN_SHARE_CONSTRAINTS);
    return stream;
  } catch (error) {
    console.error('Error accessing screen share:', error);
    throw error;
  }
}

export async function getMediaDevices() {
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    
    return {
      audioDevices: devices.filter((device) => device.kind === 'audioinput'),
      videoDevices: devices.filter((device) => device.kind === 'videoinput'),
    };
  } catch (error) {
    console.error('Error enumerating devices:', error);
    return { audioDevices: [], videoDevices: [] };
  }
}

export function createPeerConnection(): RTCPeerConnection {
  const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
  
  pc.oniceconnectionstatechange = () => {
    console.log('ICE connection state:', pc.iceConnectionState);
  };

  pc.onconnectionstatechange = () => {
    console.log('Connection state:', pc.connectionState);
  };

  return pc;
}

export function stopMediaStream(stream: MediaStream | null) {
  if (stream) {
    stream.getTracks().forEach((track) => track.stop());
  }
}

export function toggleAudioTrack(stream: MediaStream | null, enabled: boolean) {
  if (stream) {
    stream.getAudioTracks().forEach((track) => {
      track.enabled = enabled;
    });
  }
}

export function toggleVideoTrack(stream: MediaStream | null, enabled: boolean) {
  if (stream) {
    stream.getVideoTracks().forEach((track) => {
      track.enabled = enabled;
    });
  }
}