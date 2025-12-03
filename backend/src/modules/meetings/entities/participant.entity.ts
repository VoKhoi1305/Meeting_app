// import {
//   Entity,
//   PrimaryGeneratedColumn,
//   Column,
//   ManyToOne,
//   CreateDateColumn,
//   JoinColumn,
// } from 'typeorm';
// import { Meeting } from './meeting.entity';
// import { User } from '../../users/entities/user.entity';
// import { ParticipantStatus } from '../../../common/enums/participant-status.enum';

// @Entity('participants')
// export class Participant {
//   @PrimaryGeneratedColumn('uuid')
//   id: string;

//   @Column({ name: 'meeting_id' })
//   meetingId: string;

//   @ManyToOne(() => Meeting, (meeting) => meeting.participants, {
//     onDelete: 'CASCADE',
//   })
//   @JoinColumn({ name: 'meeting_id' })
//   meeting: Meeting;

//   @Column({ name: 'user_id', nullable: true })
//   userId: string;

//   @ManyToOne(() => User, { nullable: true, eager: true })
//   @JoinColumn({ name: 'user_id' })
//   user: User;

//   @Column({ length: 100 })
//   displayName: string;

//   @Column({ length: 100, nullable: true })
//   peerId: string;

//   @Column({ default: true })
//   isAudioEnabled: boolean;

//   @Column({ default: true })
//   isVideoEnabled: boolean;

//   @Column({ default: false })
//   isScreenSharing: boolean;

//   @Column({
//     type: 'enum',
//     enum: ParticipantStatus,
//     default: ParticipantStatus.CONNECTING,
//   })
//   connectionStatus: ParticipantStatus;

//   @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
//   joinedAt: Date;

//   @Column({ type: 'timestamp', nullable: true })
//   leftAt: Date;

//   @CreateDateColumn()
//   createdAt: Date;
// }

// import {
//   Entity,
//   PrimaryGeneratedColumn,
//   Column,
//   ManyToOne,
//   CreateDateColumn,
//   JoinColumn,
// } from 'typeorm';
// import { Meeting } from './meeting.entity';
// import { User } from '../../users/entities/user.entity';
// import { ParticipantStatus } from '../../../common/enums/participant-status.enum';

// @Entity('participants')
// export class Participant {
//   @PrimaryGeneratedColumn('uuid')
//   id: string;

//   // ❌ XÓA (HOẶC COMMENT) DÒNG NÀY: Gây xung đột với relation bên dưới
//   // @Column({ name: 'meeting_id' })
//   // meetingId: string;

//   // ✅ GIỮ NGUYÊN: TypeORM sẽ tự tạo cột 'meeting_id' dựa vào cấu hình này
//   @ManyToOne(() => Meeting, (meeting) => meeting.participants, {
//     onDelete: 'CASCADE',
//     nullable: false, // Thêm dòng này để bảo đảm tính toàn vẹn
//   })
//   @JoinColumn({ name: 'meeting_id' }) // Cột trong DB sẽ tên là meeting_id
//   meeting: Meeting;

//   // ❌ XÓA (HOẶC COMMENT) DÒNG NÀY
//   // @Column({ name: 'user_id', nullable: true })
//   // userId: string;

//   // ✅ GIỮ NGUYÊN
//   @ManyToOne(() => User, { nullable: true, eager: true })
//   @JoinColumn({ name: 'user_id' }) // Cột trong DB sẽ tên là user_id
//   user: User;

//   @Column({ length: 100 })
//   displayName: string;

//   @Column({ length: 100, nullable: true })
//   peerId: string;

//   @Column({ default: true })
//   isAudioEnabled: boolean;

//   @Column({ default: true })
//   isVideoEnabled: boolean;

//   @Column({ default: false })
//   isScreenSharing: boolean;

//   @Column({
//     type: 'enum',
//     enum: ParticipantStatus,
//     default: ParticipantStatus.CONNECTING,
//   })
//   connectionStatus: ParticipantStatus;

//   @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
//   joinedAt: Date;

//   @Column({ type: 'timestamp', nullable: true })
//   leftAt: Date;

//   @CreateDateColumn()
//   createdAt: Date;
  
//   // Nếu bạn thực sự cần lấy ID dạng chuỗi để dùng ở frontend mà không cần load relation
//   // Bạn có thể dùng getter (Optional)
//   get meetingId(): string {
//     return this.meeting?.id;
//   }
// }

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  JoinColumn,
} from 'typeorm';
import { Meeting } from './meeting.entity';
import { User } from '../../users/entities/user.entity';
import { ParticipantStatus } from '../../../common/enums/participant-status.enum';

@Entity('participants')
export class Participant {
  @PrimaryGeneratedColumn('uuid')
  id: string;


  @Column({ name: 'meeting_id' })
  meetingId: string;


  @ManyToOne(() => Meeting, (meeting) => meeting.participants, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'meeting_id' })
  meeting: Meeting;

 
  @Column({ name: 'user_id' })
  userId: string;


  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ length: 100 })
  displayName: string;

  @Column({ length: 100, nullable: true })
  peerId: string;

  @Column({ default: true })
  isAudioEnabled: boolean;

  @Column({ default: true })
  isVideoEnabled: boolean;

  @Column({ default: false })
  isScreenSharing: boolean;

  @Column({
    type: 'enum',
    enum: ParticipantStatus,
    default: ParticipantStatus.CONNECTING,
  })
  connectionStatus: ParticipantStatus;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  joinedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  leftAt: Date;

  @CreateDateColumn()
  createdAt: Date;
}