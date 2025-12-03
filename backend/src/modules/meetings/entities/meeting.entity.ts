import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Participant } from './participant.entity';
import { MeetingStatus } from '../../../common/enums/meeting-status.enum';

@Entity('meetings')
export class Meeting {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, length: 6 })
  roomCode: string;

  @Column({ unique: true, length: 50 })
  roomId: string;

  @Column({ length: 255 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ name: 'host_id' })
  hostId: string;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'host_id' })
  host: User;

  @Column({
    type: 'enum',
    enum: MeetingStatus,
    default: MeetingStatus.WAITING,
  })
  status: MeetingStatus;

  @Column({ type: 'timestamp', nullable: true })
  startedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  endedAt: Date;

  @OneToMany(() => Participant, (participant) => participant.meeting)
  participants: Participant[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
