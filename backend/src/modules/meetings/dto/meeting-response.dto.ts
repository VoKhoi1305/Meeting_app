export class MeetingResponseDto {
  id: string;
  roomCode: string;
  roomId: string;
  title: string;
  description?: string;
  hostId: string;
  status: string;
  createdAt: Date;
}

export class JoinMeetingResponseDto {
  meeting: MeetingResponseDto;
  participant: {
    id: string;
    displayName: string;
    isAudioEnabled: boolean;
    isVideoEnabled: boolean;
  };
}