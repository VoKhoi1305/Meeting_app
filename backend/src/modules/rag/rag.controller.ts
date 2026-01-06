import { Controller, Post, Body, UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { RagService } from './rag.service';

@Controller('rag')
export class RagController {
  constructor(private readonly ragService: RagService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadPdf(@UploadedFile() file: Express.Multer.File) {
    if (!file || file.mimetype !== 'application/pdf') {
      throw new BadRequestException('Vui lòng upload file PDF');
    }
    return this.ragService.processPdf(file.buffer, file.originalname);
  }

  @Post('chat')
  async chat(@Body('question') question: string) {
    if (!question) throw new BadRequestException('Câu hỏi không được để trống');
    return this.ragService.askQuestion(question);
  }
}