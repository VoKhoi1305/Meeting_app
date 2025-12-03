export interface Participant {
  id: string;
  displayName: string;
  peerId: string;
  userId?: string;
  isAudioEnabled: boolean;
  isVideoEnabled: boolean;
  isScreenSharing: boolean;
  connectionStatus: 'connecting' | 'connected' | 'disconnected';
  stream?: MediaStream;
}

export interface ParticipantsState {
  list: Participant[];
  localParticipant: Participant | null;
}