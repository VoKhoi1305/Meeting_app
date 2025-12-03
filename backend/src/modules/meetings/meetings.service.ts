import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IsNull } from 'typeorm';
import { Meeting } from './entities/meeting.entity';
import { Participant } from './entities/participant.entity';
import { CreateMeetingDto } from './dto/create-meeting.dto';
import { JoinMeetingDto } from './dto/join-meeting.dto';
import { MeetingStatus } from '../../common/enums/meeting-status.enum';
import { ParticipantStatus } from '../../common/enums/participant-status.enum';
import { generateRoomCode, generateRoomId } from '../../utils/code-generator.util';

@Injectable()
export class MeetingsService {
  constructor(
    @InjectRepository(Meeting)
    private meetingsRepository: Repository<Meeting>,
    @InjectRepository(Participant)
    private participantsRepository: Repository<Participant>,
  ) {}

  async create(userId: string, createMeetingDto: CreateMeetingDto): Promise<Meeting> {
    let roomCode: string = '';
    let isUnique = false;

    
    while (!isUnique) {
      roomCode = generateRoomCode();
      const existing = await this.meetingsRepository.findOne({
        where: { roomCode },
      });
      if (!existing) {
        isUnique = true;
      }
    }

    const roomId = generateRoomId();

    const meeting = this.meetingsRepository.create({
      ...createMeetingDto,
      roomCode,
      roomId,
      hostId: userId,
      status: MeetingStatus.WAITING,
    });

    return await this.meetingsRepository.save(meeting);
  }

  async findById(id: string): Promise<Meeting> {
    const meeting = await this.meetingsRepository.findOne({
      where: { id },
      relations: ['host', 'participants'],
    });

    if (!meeting) {
      throw new NotFoundException('Meeting not found');
    }

    return meeting;
  }

  async findByRoomCode(roomCode: string): Promise<Meeting> {
    const meeting = await this.meetingsRepository.findOne({
      where: { roomCode },
      relations: ['host'],
    });

    if (!meeting) {
      throw new NotFoundException('Meeting not found');
    }

    return meeting;
  }

  async findByRoomId(roomId: string): Promise<Meeting> {
    const meeting = await this.meetingsRepository.findOne({
      where: { roomId },
      relations: ['host', 'participants'],
    });

    if (!meeting) {
      throw new NotFoundException('Meeting not found');
    }

    return meeting;
  }

  async findUserMeetings(userId: string): Promise<Meeting[]> {
    return await this.meetingsRepository.find({
      where: { hostId: userId },
      order: { createdAt: 'DESC' },
      relations: ['participants'],
    });
  }

//   async joinMeeting(
//     meetingId: string,
//     userId: string,
//     joinMeetingDto: JoinMeetingDto,
//   ): Promise<{ meeting: Meeting; participant: Participant }> {
//     const meeting = await this.findById(meetingId);

//     if (meeting.status === MeetingStatus.ENDED) {
//       throw new ConflictException('Meeting has ended');
//     }

//     // Check if user already joined
//     const existingParticipant = await this.participantsRepository.findOne({
//       where: {
//         // meetingId,
//         // userId,
//         meeting: { id: meetingId }, // Map vào object meeting
//          user: { id: userId },       // Map vào object user
//         leftAt: IsNull(),
//       },
//     });

//     if (existingParticipant) {
//       return { meeting, participant: existingParticipant };
//     }

//     // Create new participant
//     const participant = this.participantsRepository.create({
//     //   meetingId,
//         meeting: meeting,
//     //   userId,
//         user: { id: userId } as any,
//       displayName: joinMeetingDto.displayName,
//       connectionStatus: ParticipantStatus.CONNECTING,
//     });

//     await this.participantsRepository.save(participant);

//     // Update meeting status to active if it's the first join
//     if (meeting.status === MeetingStatus.WAITING) {
//       meeting.status = MeetingStatus.ACTIVE;
//       meeting.startedAt = new Date();
//       await this.meetingsRepository.save(meeting);
//     }

//     return { meeting, participant };
//   }
// async joinMeeting(
// //   meetingId: string,
// //   userId: string,
// //   joinMeetingDto: JoinMeetingDto,
// // ): Promise<{ meeting: Meeting; participant: Participant }> {
// //   const meeting = await this.findById(meetingId);

// //   if (meeting.status === MeetingStatus.ENDED) {
// //     throw new ConflictException('Meeting has ended');
// //   }
//     meetingId: string,
//     userId: string,
//     joinMeetingDto: JoinMeetingDto,
//   ): Promise<{ meeting: Meeting; participant: Participant }> {
//     const meeting = await this.findById(meetingId); // Bạn đã có meeting entity ở đây

//     if (meeting.status === MeetingStatus.ENDED) {
//       throw new ConflictException('Meeting has ended');
//     }

//   // Check existing active participant
//   const existingParticipant = await this.participantsRepository.findOne({
//     where: {
//       meeting: { id: meetingId },
//       user: { id: userId },
//       leftAt: IsNull(),
//     },
//     relations: ['user', 'meeting'],
//   });

//   if (existingParticipant) {
//     return { meeting, participant: existingParticipant };
//   }

//   // Create new participant
//   const participant = this.participantsRepository.create({
//     meeting: meeting,
//     user: { id: userId } as any,
//     displayName: joinMeetingDto.displayName,
//     connectionStatus: ParticipantStatus.CONNECTING,
//   });

//   await this.participantsRepository.save(participant);

//   // Update meeting to active
//   if (meeting.status === MeetingStatus.WAITING) {
//     meeting.status = MeetingStatus.ACTIVE;
//     meeting.startedAt = new Date();
//     await this.meetingsRepository.save(meeting);
//   }

//   return { meeting, participant };
// }

async joinMeeting(
  meetingId: string,
  userId: string,
  joinMeetingDto: JoinMeetingDto,
): Promise<{ meeting: Meeting; participant: Participant }> {

  const meeting = await this.findById(meetingId);

  if (meeting.status === MeetingStatus.ENDED) {
    throw new ConflictException('Meeting has ended');
  }


  const existingParticipant = await this.participantsRepository.findOne({
    where: {
      meeting: { id: meetingId },
      user: { id: userId },
      leftAt: IsNull(),
    },
    relations: ['user', 'meeting'],
  });

  if (existingParticipant) {
    return { meeting, participant: existingParticipant };
  }

  const participant = this.participantsRepository.create({
    meeting: meeting, 
    user: { id: userId } as any,
    displayName: joinMeetingDto.displayName,
    connectionStatus: ParticipantStatus.CONNECTING,
  });

  const savedParticipant = await this.participantsRepository.save(participant);

  
  if (meeting.status === MeetingStatus.WAITING) {
    await this.meetingsRepository.update(meeting.id, {
       status: MeetingStatus.ACTIVE,
       startedAt: new Date(),
    });

    meeting.status = MeetingStatus.ACTIVE;
  }

  return { meeting, participant: savedParticipant };
}

  async leaveMeeting(participantId: string): Promise<void> {
    const participant = await this.participantsRepository.findOne({
      where: { id: participantId },
    });

    if (!participant) {
      throw new NotFoundException('Participant not found');
    }

    participant.leftAt = new Date();
    participant.connectionStatus = ParticipantStatus.DISCONNECTED;
    await this.participantsRepository.save(participant);
  }

  async updateParticipant(
    participantId: string,
    updates: Partial<Participant>,
  ): Promise<Participant> {
    const participant = await this.participantsRepository.findOne({
      where: { id: participantId },
    });

    if (!participant) {
      throw new NotFoundException('Participant not found');
    }

    Object.assign(participant, updates);
    return await this.participantsRepository.save(participant);
  }

  async endMeeting(meetingId: string, userId: string): Promise<Meeting> {
    const meeting = await this.findById(meetingId);

    if (meeting.hostId !== userId) {
      throw new ForbiddenException('Only host can end the meeting');
    }

    if (meeting.status === MeetingStatus.ENDED) {
      throw new ConflictException('Meeting already ended');
    }

    meeting.status = MeetingStatus.ENDED;
    meeting.endedAt = new Date();

  
    await this.participantsRepository.update(
      {
        meetingId,
        leftAt: IsNull(),
      },
      {
        leftAt: new Date(),
        connectionStatus: ParticipantStatus.DISCONNECTED,
      },
    );

    return await this.meetingsRepository.save(meeting);
  }

  async getActiveParticipants(meetingId: string): Promise<Participant[]> {
    return await this.participantsRepository.find({
      where: {
        meetingId,
        leftAt: IsNull(),
      },
      relations: ['user'],
    });
  }
}