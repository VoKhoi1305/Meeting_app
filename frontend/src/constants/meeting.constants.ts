export const MEETING_STATUS = {
  WAITING: 'waiting',
  ACTIVE: 'active',
  ENDED: 'ended',
} as const;

export const WEBSOCKET_EVENTS = {
  // Meetings namespace
  JOIN_ROOM: 'join-room',
  LEAVE_ROOM: 'leave-room',
  USER_JOINED: 'user-joined',
  USER_LEFT: 'user-left',
  PARTICIPANT_UPDATED: 'participant-updated',
  PARTICIPANTS_LIST: 'participants-list',
  TOGGLE_AUDIO: 'toggle-audio',
  TOGGLE_VIDEO: 'toggle-video',
  START_SCREEN_SHARE: 'start-screen-share',
  STOP_SCREEN_SHARE: 'stop-screen-share',
  MEETING_ENDED: 'meeting-ended',
  
  // WebRTC namespace
  OFFER: 'offer',
  ANSWER: 'answer',
  ICE_CANDIDATE: 'ice-candidate',
  EXISTING_PARTICIPANTS: 'existing-participants',
  NEW_PARTICIPANT: 'new-participant',
  PARTICIPANT_LEFT: 'participant-left',
} as const;