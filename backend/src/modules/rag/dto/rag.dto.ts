import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UploadPdfDto {
  @IsString()
  @IsNotEmpty({ message: 'userId không được để trống' })
  userId: string;

  @IsString()
  @IsOptional()
  sessionId?: string; 
}

export class ChatDto {
  @IsString()
  @IsNotEmpty({ message: 'Câu hỏi không được để trống' })
  question: string;

  @IsString()
  @IsNotEmpty({ message: 'userId không được để trống' })
  userId: string;

  @IsString()
  @IsOptional()
  sessionId?: string;
}