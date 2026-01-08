import { 
  Body, 
  Controller, 
  Post, 
  UploadedFile, 
  UseInterceptors, 
  BadRequestException,
  Get,
  InternalServerErrorException
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { RagService } from './rag.service';
import { ChatDto, UploadPdfDto } from './dto/rag.dto';

@Controller('rag')
export class RagController {
  constructor(private readonly ragService: RagService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadPdf(
    @UploadedFile() file: Express.Multer.File, 
    @Body() dto: UploadPdfDto 
  ) {
    if (!file) {
      throw new BadRequestException('Vui lòng upload file PDF.');
    }
    
    return this.ragService.processPdf(
      file.buffer, 
      file.originalname, 
      dto.userId, 
      dto.sessionId
    );
  }

  @Post('chat')
  async chat(@Body() dto: ChatDto) {
    return this.ragService.askQuestion(
      dto.question, 
      dto.userId, 
      dto.sessionId
    );
  }

  @Get('status')
  async checkStatus() {
    return this.ragService.checkDatabaseStats();
  }
}