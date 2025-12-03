export interface Meeting {
  id: string;
  roomCode: string;
  roomId: string;
  title: string;
  description?: string;
  hostId: string;
  status: 'waiting' | 'active' | 'ended';
  startedAt?: Date;
  endedAt?: Date;
  createdAt: Date;
}

export interface CreateMeetingDto {
  title: string;
  description?: string;
}

export interface JoinMeetingDto {
  displayName: string;
}

export interface MeetingState {
  current: Meeting | null;
  myParticipantId: string | null;
  isHost: boolean;
  loading: boolean;
  error: string | null;
}