import api from './api';
import type { Meeting, CreateMeetingDto, JoinMeetingDto } from '../types/meeting.types';

export const meetingService = {
  async createMeeting(data: CreateMeetingDto): Promise<Meeting> {
    const response = await api.post('/meetings', data);
    return response.data.data;
  },

  async getMeetingById(id: string): Promise<Meeting> {
    const response = await api.get(`/meetings/${id}`);
    return response.data.data;
  },

  async getMeetingByRoomId(roomId: string): Promise<Meeting> {
    const response = await api.get(`/meetings/room/${roomId}`);
    return response.data.data;
  },

  async getMeetingByRoomCode(roomCode: string): Promise<Meeting> {
    const response = await api.get(`/meetings/code/${roomCode}`);
    return response.data.data;
  },

  async joinMeeting(meetingId: string, data: JoinMeetingDto) {
    const response = await api.post(`/meetings/${meetingId}/join`, data);
    return response.data.data;
  },

  async endMeeting(meetingId: string): Promise<void> {
    await api.patch(`/meetings/${meetingId}/end`);
  },

  async getUserMeetings(): Promise<Meeting[]> {
    const response = await api.get('/meetings');
    return response.data.data;
  },

  async getParticipants(meetingId: string) {
    const response = await api.get(`/meetings/${meetingId}/participants`);
    return response.data.data;
  },
};