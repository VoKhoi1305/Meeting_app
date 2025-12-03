// src/modules/meetings/meetings.controller.ts
import {
  Controller,
  Post,
  Get,
  Patch,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { MeetingsService } from './meetings.service';
import { CreateMeetingDto } from './dto/create-meeting.dto';
import { JoinMeetingDto } from './dto/join-meeting.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('meetings')
@UseGuards(JwtAuthGuard)
export class MeetingsController {
  constructor(private readonly meetingsService: MeetingsService) {}

  @Post()
  async create(
    @CurrentUser() user: any,
    @Body() createMeetingDto: CreateMeetingDto,
  ) {
    const meeting = await this.meetingsService.create(user.id, createMeetingDto);
    return {
      success: true,
      data: {
        id: meeting.id,
        roomCode: meeting.roomCode,
        roomId: meeting.roomId,
        title: meeting.title,
        description: meeting.description,
        status: meeting.status,
        hostId: meeting.hostId,
        createdAt: meeting.createdAt,
      },
    };
  }

  @Get(':id')
  async findById(@Param('id') id: string) {
    const meeting = await this.meetingsService.findById(id);
    return {
      success: true,
      data: meeting,
    };
  }

  @Get('room/:roomId')
  async findByRoomId(@Param('roomId') roomId: string) {
    const meeting = await this.meetingsService.findByRoomId(roomId);
    return {
      success: true,
      data: meeting,
    };
  }

  @Get('code/:roomCode')
  async findByRoomCode(@Param('roomCode') roomCode: string) {
    const meeting = await this.meetingsService.findByRoomCode(roomCode);
    return {
      success: true,
      data: {
        id: meeting.id,
        roomId: meeting.roomId,
        title: meeting.title,
        status: meeting.status,
      },
    };
  }

  @Get()
  async findUserMeetings(@CurrentUser() user: any) {
    const meetings = await this.meetingsService.findUserMeetings(user.id);
    return {
      success: true,
      data: meetings,
    };
  }

  @Post(':id/join')
  async joinMeeting(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Body() joinMeetingDto: JoinMeetingDto,
  ) {
    const { meeting, participant } = await this.meetingsService.joinMeeting(
      id,
      user.id,
      joinMeetingDto,
    );

    return {
      success: true,
      data: {
        meeting: {
          id: meeting.id,
          roomCode: meeting.roomCode,
          roomId: meeting.roomId,
          title: meeting.title,
          description: meeting.description,
          status: meeting.status,
          hostId: meeting.hostId,
        },
        participant: {
          id: participant.id,
          displayName: participant.displayName,
          isAudioEnabled: participant.isAudioEnabled,
          isVideoEnabled: participant.isVideoEnabled,
        },
      },
    };
  }

  @Patch(':id/end')
  async endMeeting(@Param('id') id: string, @CurrentUser() user: any) {
    const meeting = await this.meetingsService.endMeeting(id, user.id);
    return {
      success: true,
      message: 'Meeting ended successfully',
      data: meeting,
    };
  }

  @Get(':id/participants')
  async getParticipants(@Param('id') id: string) {
    const participants = await this.meetingsService.getActiveParticipants(id);
    return {
      success: true,
      data: participants,
    };
  }
}