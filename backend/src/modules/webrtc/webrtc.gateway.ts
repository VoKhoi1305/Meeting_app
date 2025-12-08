// // src/modules/webrtc/webrtc.gateway.ts
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

// @WebSocketGateway({
//   cors: {
//     //origin: process.env.FRONTEND_URL || 'http://localhost:5173' || 'https://khoiva.id.vn',
//     origin: true,
//      methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
//     credentials: true,
//   },
//   namespace: 'webrtc',
// })
// export class WebRTCGateway implements OnGatewayConnection, OnGatewayDisconnect {
//   @WebSocketServer()
//   server: Server;

//   private logger = new Logger('WebRTCGateway');

//   constructor(private jwtService: JwtService) {}

//   async handleConnection(client: Socket) {
//     try {
//       const token = client.handshake.auth.token;
//       if (!token) {
//         client.disconnect();
//         return;
//       }

//       const payload = this.jwtService.verify(token);
//       client.data.user = payload;

//       this.logger.log(`WebRTC client connected: ${client.id}`);
//     } catch (error) {
//       this.logger.error('WebRTC connection error:', error);
//       client.disconnect();
//     }
//   }

//   handleDisconnect(client: Socket) {
//     this.logger.log(`WebRTC client disconnected: ${client.id}`);
//   }

//   @SubscribeMessage('join-room')
//   handleJoinRoom(
//     @ConnectedSocket() client: Socket,
//     @MessageBody() data: { roomId: string },
//   ) {
//     const { roomId } = data;
//     client.join(roomId);

//     const room = this.server.sockets.adapter.rooms.get(roomId);
//     const participants = room
//       ? Array.from(room).filter((socketId) => socketId !== client.id)
//       : [];

//     client.emit('existing-participants', {
//       participants: participants.map((socketId) => ({
//         peerId: socketId,
//       })),
//     });

//     client.to(roomId).emit('new-participant', {
//       peerId: client.id,
//     });

//     this.logger.log(`Client ${client.id} joined WebRTC room: ${roomId}`);
//   }

//   @SubscribeMessage('offer')
//   handleOffer(
//     @ConnectedSocket() client: Socket,
//     @MessageBody() data: { target: string; offer: any; roomId: string },
//   ) {
//     const { target, offer, roomId } = data;

//     this.logger.log(`Offer from ${client.id} to ${target}`);

//     this.server.to(target).emit('offer', {
//       sender: client.id,
//       offer,
//     });
//   }

//   @SubscribeMessage('answer')
//   handleAnswer(
//     @ConnectedSocket() client: Socket,
//     @MessageBody() data: { target: string; answer: any },
//   ) {
//     const { target, answer } = data;

//     this.logger.log(`Answer from ${client.id} to ${target}`);

//     this.server.to(target).emit('answer', {
//       sender: client.id,
//       answer,
//     });
//   }

//   @SubscribeMessage('ice-candidate')
//   handleIceCandidate(
//     @ConnectedSocket() client: Socket,
//     @MessageBody() data: { target: string; candidate: any },
//   ) {
//     const { target, candidate } = data;

//     this.server.to(target).emit('ice-candidate', {
//       sender: client.id,
//       candidate,
//     });
//   }

//   @SubscribeMessage('leave-room')
//   handleLeaveRoom(
//     @ConnectedSocket() client: Socket,
//     @MessageBody() data: { roomId: string },
//   ) {
//     const { roomId } = data;
//     client.leave(roomId);

//     client.to(roomId).emit('participant-left', {
//       peerId: client.id,
//     });

//     this.logger.log(`Client ${client.id} left WebRTC room: ${roomId}`);
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

@WebSocketGateway({
  cors: {
    origin: '*', 
    methods: ['GET', 'POST'],
    credentials: true,
  },
  namespace: 'webrtc',
})
export class WebRTCGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private logger = new Logger('WebRTCGateway');

  constructor(private readonly jwtService: JwtService) {}

  async handleConnection(client: Socket) {
    try {
      // 1. Lấy token từ handshake
      const token =
        client.handshake.auth.token || client.handshake.headers.authorization;

      if (!token) {
        this.logger.warn(`Client ${client.id} missing token`);
        client.disconnect();
        return;
      }

      // 2. Xác thực
      const cleanToken = token.replace('Bearer ', '');
      const payload = this.jwtService.verify(cleanToken);
      client.data.user = payload;

      this.logger.log(`✅ WebRTC Client connected: ${client.id} (${payload.email})`);
    } catch (error) {
      this.logger.error(`Connection unauthorized: ${error.message}`);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`WebRTC Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('join-room')
  handleJoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string },
  ) {
    if (!client.data.user) {
      client.disconnect();
      return;
    }

    const { roomId } = data;
    client.join(roomId);

    // Lấy danh sách socket khác trong phòng
    const room = this.server.of('/webrtc').adapter.rooms.get(roomId);
    const participants = room
      ? Array.from(room).filter((id) => id !== client.id)
      : [];

    // Gửi danh sách người cũ cho người mới (để người mới gọi)
    client.emit('existing-participants', {
      participants: participants.map((id) => ({ peerId: id })),
    });

    // Báo cho người cũ biết có người mới
    client.to(roomId).emit('new-participant', {
      peerId: client.id,
    });

    this.logger.log(
      `User ${client.data.user.email} (${client.id}) joined WebRTC room ${roomId}`,
    );
  }

  @SubscribeMessage('offer')
  handleOffer(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { target: string; offer: any; roomId: string },
  ) {
    this.server.of('/webrtc').to(data.target).emit('offer', {
      sender: client.id,
      offer: data.offer,
    });
  }

  @SubscribeMessage('answer')
  handleAnswer(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { target: string; answer: any },
  ) {
    this.server.of('/webrtc').to(data.target).emit('answer', {
      sender: client.id,
      answer: data.answer,
    });
  }

  @SubscribeMessage('ice-candidate')
  handleIceCandidate(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { target: string; candidate: any },
  ) {
    this.server.of('/webrtc').to(data.target).emit('ice-candidate', {
      sender: client.id,
      candidate: data.candidate,
    });
  }
}