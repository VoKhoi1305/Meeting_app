import { IsBoolean, IsOptional } from 'class-validator';

export class UpdateParticipantDto {
  @IsBoolean()
  @IsOptional()
  isAudioEnabled?: boolean;

  @IsBoolean()
  @IsOptional()
  isVideoEnabled?: boolean;

  @IsBoolean()
  @IsOptional()
  isScreenSharing?: boolean;
}