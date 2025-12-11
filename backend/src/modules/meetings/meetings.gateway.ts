// import {
//   WebSocketGateway,
//   WebSocketServer,
//   SubscribeMessage,
//   OnGatewayConnection,
//   OnGatewayDisconnect,
//   ConnectedSocket,
//   MessageBody,
// } from '@nestjs/websockets';
// import { Server, Socket } from 'socket.io';
// import { Logger } from '@nestjs/common';
// import { JwtService } from '@nestjs/jwt';
// import { MeetingsService } from './meetings.service';
// import { ParticipantStatus } from '../../common/enums/participant-status.enum';

// @WebSocketGateway({
//   cors: {
//     origin: true,
//     methods: ['GET', 'POST'],
//     credentials: true,
//   },
//   namespace: 'meetings',
// })
// export class MeetingsGateway implements OnGatewayConnection, OnGatewayDisconnect {
//   @WebSocketServer()
//   server: Server;

//   private logger = new Logger('MeetingsGateway');

//   constructor(
//     private meetingsService: MeetingsService,
//     private jwtService: JwtService,
//   ) {}

//   async handleConnection(client: Socket) {
//     try {
//       const token =
//         client.handshake.auth.token || client.handshake.headers.authorization;

//       if (!token) {
//         client.disconnect();
//         return;
//       }

//       const cleanToken = token.replace('Bearer ', '');
//       const payload = this.jwtService.verify(cleanToken);
//       client.data.user = payload;

//       this.logger.log(`✅ Meetings Client connected: ${client.id}`);
//     } catch (error) {
//       client.disconnect();
//     }
//   }

//   async handleDisconnect(client: Socket) {
//     const { roomId, participantId } = client.data;

//     if (roomId && participantId) {
//       this.logger.log(`Client disconnected abruptly: ${participantId} from room ${roomId}`);

//       try {
//         await this.meetingsService.leaveMeeting(participantId);
//         this.server.to(roomId).emit('participant-left', { participantId });
        
//       } catch (error) {
//         this.logger.error('Error handling disconnect:', error);
//       }
//     }  }

//   @SubscribeMessage('join-room')
//   async handleJoinRoom(
//     @ConnectedSocket() client: Socket,
//     @MessageBody() data: { roomId: string; participantId: string; webRTCPeerId?: string },
//   ) {
//     if (!client.data.user) return;

//     const { roomId, participantId, webRTCPeerId } = data;

//     client.data.roomId = roomId;
//     client.data.participantId = participantId;

//     client.join(roomId);

//     const peerIdToSave = webRTCPeerId || client.id;

//     await this.meetingsService.updateParticipant(participantId, {
//       connectionStatus: ParticipantStatus.CONNECTED,
//       peerId: peerIdToSave,
//     });

//     // Lấy danh sách participant hiện tại từ DB
//     const meeting = await this.meetingsService.findByRoomId(roomId);
//     const participants = await this.meetingsService.getActiveParticipants(meeting.id);

//     // Báo cho người khác trong phòng biết có người mới vào
//     client.to(roomId).emit('user-joined', {
//       participant: participants.find((p) => p.id === participantId),
//     });

//     // Gửi danh sách người đang online cho người mới vào
//     client.emit('participants-list', {
//       participants: participants.map((p) => ({
//         id: p.id,
//         displayName: p.displayName,
//         peerId: p.peerId,
//         isAudioEnabled: p.isAudioEnabled,
//         isVideoEnabled: p.isVideoEnabled,
//         isScreenSharing: p.isScreenSharing,
//         userId: p.user.id,
//       })),
//     });
//   }

//   @SubscribeMessage('leave-meeting')
//   async handleLeaveMeeting(
//     @ConnectedSocket() client: Socket,
//     @MessageBody() data: { roomId: string; participantId: string },
//   ) {
//     const { roomId, participantId } = data;
    
//     try {
//       await this.meetingsService.leaveMeeting(participantId);
      
//       client.to(roomId).emit('participant-left', { participantId });
      
//       client.leave(roomId);
//       client.data.roomId = null;
//       client.data.participantId = null;

//       this.logger.log(`User ${participantId} left meeting ${roomId}`);
//     } catch (error) {
//       this.logger.error('Error leaving meeting:', error);
//     }
//   }

//   @SubscribeMessage('meeting-ended')
//   handleMeetingEnded(
//     @ConnectedSocket() client: Socket,
//     @MessageBody() data: { roomId: string },
//   ) {
//     const { roomId } = data;
    
//     // Log kiểm tra
//     this.logger.log(`Meeting ended event received for room: ${roomId}`);

//     // Phát sự kiện cho TẤT CẢ mọi người trong phòng (bao gồm cả host)
//     this.server.to(roomId).emit('meeting-ended', {
//       message: 'Cuộc họp đã được kết thúc bởi chủ phòng.',
//     });
//   }

//   @SubscribeMessage('update-name')
//   async handleUpdateName(
//     @ConnectedSocket() client: Socket,
//     @MessageBody() data: { roomId: string; participantId: string; displayName: string },
//   ) {
//     try {
//       const { roomId, participantId, displayName } = data;

//       // Cập nhật vào Database
//       await this.meetingsService.updateParticipant(participantId, {
//         displayName: displayName,
//       });

//       // Báo cho mọi người trong phòng (để cập nhật UI list participants)
//       this.server.to(roomId).emit('participant-updated', {
//         participantId,
//         updates: { displayName: displayName },
//       });

//       this.logger.log(`Name updated: ${participantId} -> ${displayName}`);
//     } catch (error) {
//       this.logger.error('Error updating name:', error);
//       client.emit('error', { code: 'UPDATE_NAME_ERROR', message: error.message });
//     }
//   }
// }

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

  // --- SỬA ĐỔI QUAN TRỌNG: Xử lý khi mất kết nối (Tắt tab/Mất mạng) ---
  async handleDisconnect(client: Socket) {
    const { roomId, participantId } = client.data;

    // Nếu client này đã từng join room (có lưu data)
    if (roomId && participantId) {
      this.logger.log(`⚠️ Client disconnected abruptly: ${participantId} from room ${roomId}`);

      try {
        // 1. Cập nhật DB: set status DISCONNECTED
        await this.meetingsService.leaveMeeting(participantId);

        // 2. Báo cho mọi người trong phòng biết để xóa khỏi UI
        this.server.to(roomId).emit('participant-left', { participantId });
      } catch (error) {
        this.logger.error('Error handling disconnect:', error);
      }
    }
  }

  @SubscribeMessage('join-room')
  async handleJoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string; participantId: string; webRTCPeerId?: string },
  ) {
    if (!client.data.user) return;

    const { roomId, participantId, webRTCPeerId } = data;

    // --- QUAN TRỌNG: Lưu lại info để dùng khi disconnect ---
    client.data.roomId = roomId;
    client.data.participantId = participantId;
    // ------------------------------------------------------

    client.join(roomId);

    const peerIdToSave = webRTCPeerId || client.id;

    await this.meetingsService.updateParticipant(participantId, {
      connectionStatus: ParticipantStatus.CONNECTED,
      peerId: peerIdToSave,
    });

    const meeting = await this.meetingsService.findByRoomId(roomId);
    const participants = await this.meetingsService.getActiveParticipants(meeting.id);

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
        userId: p.user.id,
      })),
    });
  }

  // --- BỔ SUNG: Xử lý khi bấm nút Leave (Chủ động rời) ---
  @SubscribeMessage('leave-meeting')
  async handleLeaveMeeting(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string; participantId: string },
  ) {
    const { roomId, participantId } = data;
    
    try {
      await this.meetingsService.leaveMeeting(participantId);
      
      // Báo cho user khác
      client.to(roomId).emit('participant-left', { participantId });
      
      // Rời socket room
      client.leave(roomId);
      
      // Xóa data trong socket để tránh trigger handleDisconnect lần nữa (nếu socket chưa đóng)
      client.data.roomId = null;
      client.data.participantId = null;

      this.logger.log(`User ${participantId} left meeting ${roomId}`);
    } catch (error) {
      this.logger.error('Error leaving meeting:', error);
    }
  }

  @SubscribeMessage('meeting-ended')
  handleMeetingEnded(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string },
  ) {
    const { roomId } = data;
    this.logger.log(`Meeting ended event received for room: ${roomId}`);
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
      await this.meetingsService.updateParticipant(participantId, {
        displayName: displayName,
      });
      this.server.to(roomId).emit('participant-updated', {
        participantId,
        updates: { displayName: displayName },
      });
    } catch (error) {
      this.logger.error('Error updating name:', error);
    }
  }
}