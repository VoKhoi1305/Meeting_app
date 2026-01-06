// import { Controller, Post, Body, UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common';
// import { FileInterceptor } from '@nestjs/platform-express';
// import { RagService } from './rag.service';

// @Controller('rag')
// export class RagController {
//   constructor(private readonly ragService: RagService) {}

//   @Post('upload')
//   @UseInterceptors(FileInterceptor('file'))
//   async uploadPdf(@UploadedFile() file: Express.Multer.File) {
//     if (!file || file.mimetype !== 'application/pdf') {
//       throw new BadRequestException('Vui lòng upload file PDF');
//     }
//     return this.ragService.processPdf(file.buffer, file.originalname);
//   }

//   @Post('chat')
//   async chat(@Body('question') question: string) {
//     if (!question) throw new BadRequestException('Câu hỏi không được để trống');
//     return this.ragService.askQuestion(question);
//   }
// }

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
    @Body() dto: UploadPdfDto // Nhận userId, sessionId từ Body
  ) {
    if (!file) {
      throw new BadRequestException('Vui lòng upload file PDF.');
    }
    
    // Truyền buffer, filename và thông tin định danh xuống Service
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

  // API test nhanh xem DB có hoạt động không
  @Get('status')
  async checkStatus() {
    return this.ragService.checkDatabaseStats();
  }
}