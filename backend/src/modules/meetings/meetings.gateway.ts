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
import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { MeetingsService } from './meetings.service';
import { ParticipantStatus } from '../../common/enums/participant-status.enum';

@WebSocketGateway({
  cors: {
    origin: true,
    methods: ['GET', 'POST'],
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
      const token =
        client.handshake.auth.token || client.handshake.headers.authorization;

      if (!token) {
        client.disconnect();
        return;
      }

      const cleanToken = token.replace('Bearer ', '');
      const payload = this.jwtService.verify(cleanToken);
      client.data.user = payload;

      this.logger.log(`✅ Meetings Client connected: ${client.id}`);
    } catch (error) {
      client.disconnect();
    }
  }

  async handleDisconnect(client: Socket) {
    // Logic xử lý khi disconnect nếu cần
  }

  @SubscribeMessage('join-room')
  async handleJoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string; participantId: string; webRTCPeerId?: string },
  ) {
    if (!client.data.user) return;

    const { roomId, participantId, webRTCPeerId } = data;
    client.join(roomId);

    // QUAN TRỌNG: Dùng webRTCPeerId gửi từ client (nếu có) để lưu vào DB
    // Điều này giúp WebRTC Gateway (ở namespace khác) tìm đúng người dùng khi trao đổi signal
    const peerIdToSave = webRTCPeerId || client.id;

    await this.meetingsService.updateParticipant(participantId, {
      connectionStatus: ParticipantStatus.CONNECTED,
      peerId: peerIdToSave,
    });

    // Lấy danh sách participant hiện tại từ DB
    const meeting = await this.meetingsService.findByRoomId(roomId);
    const participants = await this.meetingsService.getActiveParticipants(meeting.id);

    // Báo cho người khác trong phòng biết có người mới vào
    client.to(roomId).emit('user-joined', {
      participant: participants.find((p) => p.id === participantId),
    });

    // Gửi danh sách người đang online cho người mới vào
    client.emit('participants-list', {
      participants: participants.map((p) => ({
        id: p.id,
        displayName: p.displayName,
        peerId: p.peerId,
        isAudioEnabled: p.isAudioEnabled,
        isVideoEnabled: p.isVideoEnabled,
        isScreenSharing: p.isScreenSharing,
        userId: p.user.id,
      })),
    });
  }


  @SubscribeMessage('meeting-ended')
  handleMeetingEnded(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string },
  ) {
    const { roomId } = data;
    
    // Log kiểm tra
    this.logger.log(`Meeting ended event received for room: ${roomId}`);

    // Phát sự kiện cho TẤT CẢ mọi người trong phòng (bao gồm cả host)
    this.server.to(roomId).emit('meeting-ended', {
      message: 'Cuộc họp đã được kết thúc bởi chủ phòng.',
    });
  }

  @SubscribeMessage('update-name')
  async handleUpdateName(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string; participantId: string; displayName: string },
  ) {
    try {
      const { roomId, participantId, displayName } = data;

      // Cập nhật vào Database
      await this.meetingsService.updateParticipant(participantId, {
        displayName: displayName,
      });

      // Báo cho mọi người trong phòng (để cập nhật UI list participants)
      this.server.to(roomId).emit('participant-updated', {
        participantId,
        updates: { displayName: displayName },
      });

      this.logger.log(`Name updated: ${participantId} -> ${displayName}`);
    } catch (error) {
      this.logger.error('Error updating name:', error);
      client.emit('error', { code: 'UPDATE_NAME_ERROR', message: error.message });
    }
  }
}