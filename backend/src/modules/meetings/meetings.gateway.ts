// src/modules/meetings/meetings.gateway.ts
import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, UseGuards } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { MeetingsService } from './meetings.service';
import { ParticipantStatus } from '../../common/enums/participant-status.enum';

@WebSocketGateway({
  cors: {
   // origin: process.env.FRONTEND_URL || 'http://localhost:5173' || 'https://khoiva.id.vn',
    origin: '*', 
    credentials: true,
  },
  namespace: 'meetings',
})
export class MeetingsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private logger = new Logger('MeetingsGateway');

  constructor(
    private meetingsService: MeetingsService,
    private jwtService: JwtService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      // Verify JWT token
      const token = client.handshake.auth.token;
      if (!token) {
        client.disconnect();
        return;
      }

      const payload = this.jwtService.verify(token);
      client.data.user = payload;

      this.logger.log(`Client connected: ${client.id}, User: ${payload.email}`);
    } catch (error) {
      this.logger.error('Connection error:', error);
      client.disconnect();
    }
  }

  async handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);

    // Leave all rooms and update participant status
    const rooms = Array.from(client.rooms).filter((room) => room !== client.id);
    for (const roomId of rooms) {
      await this.handleLeaveRoom(client, { roomId });
    }
  }

  @SubscribeMessage('join-room')
  async handleJoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string; participantId: string },
  ) {
    try {
      const { roomId, participantId } = data;

      
      client.join(roomId);


      await this.meetingsService.updateParticipant(participantId, {
        connectionStatus: ParticipantStatus.CONNECTED,
        peerId: client.id,
      });

   
      const meeting = await this.meetingsService.findByRoomId(roomId);
      const participants = await this.meetingsService.getActiveParticipants(
        meeting.id,
      );

     
      client.to(roomId).emit('user-joined', {
        participant: participants.find((p) => p.id === participantId),
      });

      
      client.emit('participants-list', {
        participants: participants.map((p) => ({
          id: p.id,
          displayName: p.displayName,
          peerId: p.peerId,
          isAudioEnabled: p.isAudioEnabled,
          isVideoEnabled: p.isVideoEnabled,
          isScreenSharing: p.isScreenSharing,
       //   userId: p.userId,
        userId: p.user.id,
        })),
      });

      this.logger.log(`User joined room: ${roomId}, Participant: ${participantId}`);
    } catch (error) {
      this.logger.error('Error joining room:', error);
      client.emit('error', {
        code: 'JOIN_ROOM_ERROR',
        message: error.message,
      });
    }
  }

  @SubscribeMessage('leave-room')
  async handleLeaveRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string },
  ) {
    try {
      const { roomId } = data;

      // Find participant by peerId (socket.id)
      const meeting = await this.meetingsService.findByRoomId(roomId);
      const participants = await this.meetingsService.getActiveParticipants(
        meeting.id,
      );
      const participant = participants.find((p) => p.peerId === client.id);

      if (participant) {
        // Update participant status
        await this.meetingsService.leaveMeeting(participant.id);

        // Notify other participants
        client.to(roomId).emit('user-left', {
          participantId: participant.id,
        });

        this.logger.log(`User left room: ${roomId}, Participant: ${participant.id}`);
      }

      // Leave socket room
      client.leave(roomId);
    } catch (error) {
      this.logger.error('Error leaving room:', error);
    }
  }

  @SubscribeMessage('toggle-audio')
  async handleToggleAudio(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string; participantId: string; isEnabled: boolean },
  ) {
    try {
      const { roomId, participantId, isEnabled } = data;

      await this.meetingsService.updateParticipant(participantId, {
        isAudioEnabled: isEnabled,
      });

      // Broadcast to room
      this.server.to(roomId).emit('participant-updated', {
        participantId,
        updates: { isAudioEnabled: isEnabled },
      });

      this.logger.log(`Audio toggled: ${participantId}, Enabled: ${isEnabled}`);
    } catch (error) {
      this.logger.error('Error toggling audio:', error);
      client.emit('error', { code: 'TOGGLE_AUDIO_ERROR', message: error.message });
    }
  }

  @SubscribeMessage('toggle-video')
  async handleToggleVideo(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string; participantId: string; isEnabled: boolean },
  ) {
    try {
      const { roomId, participantId, isEnabled } = data;

      await this.meetingsService.updateParticipant(participantId, {
        isVideoEnabled: isEnabled,
      });

      // Broadcast to room
      this.server.to(roomId).emit('participant-updated', {
        participantId,
        updates: { isVideoEnabled: isEnabled },
      });

      this.logger.log(`Video toggled: ${participantId}, Enabled: ${isEnabled}`);
    } catch (error) {
      this.logger.error('Error toggling video:', error);
      client.emit('error', { code: 'TOGGLE_VIDEO_ERROR', message: error.message });
    }
  }

  @SubscribeMessage('start-screen-share')
  async handleStartScreenShare(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string; participantId: string },
  ) {
    try {
      const { roomId, participantId } = data;

      await this.meetingsService.updateParticipant(participantId, {
        isScreenSharing: true,
      });

      // Broadcast to room
      this.server.to(roomId).emit('participant-updated', {
        participantId,
        updates: { isScreenSharing: true },
      });

      this.logger.log(`Screen share started: ${participantId}`);
    } catch (error) {
      this.logger.error('Error starting screen share:', error);
      client.emit('error', {
        code: 'START_SCREEN_SHARE_ERROR',
        message: error.message,
      });
    }
  }

  @SubscribeMessage('stop-screen-share')
  async handleStopScreenShare(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string; participantId: string },
  ) {
    try {
      const { roomId, participantId } = data;

      await this.meetingsService.updateParticipant(participantId, {
        isScreenSharing: false,
      });

      // Broadcast to room
      this.server.to(roomId).emit('participant-updated', {
        participantId,
        updates: { isScreenSharing: false },
      });

      this.logger.log(`Screen share stopped: ${participantId}`);
    } catch (error) {
      this.logger.error('Error stopping screen share:', error);
      client.emit('error', {
        code: 'STOP_SCREEN_SHARE_ERROR',
        message: error.message,
      });
    }
  }

  @SubscribeMessage('meeting-ended')
  handleMeetingEnded(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string },
  ) {
    const { roomId } = data;

    // Broadcast to all in room
    this.server.to(roomId).emit('meeting-ended', {
      message: 'Meeting has been ended by the host',
    });

    this.logger.log(`Meeting ended: ${roomId}`);
  }
}