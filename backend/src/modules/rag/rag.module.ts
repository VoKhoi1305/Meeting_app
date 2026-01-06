import { Module } from '@nestjs/common';
import { RagController } from './rag.controller';
import { RagService } from './rag.service';
import { MulterModule } from '@nestjs/platform-express';
@Module({
    imports: [
    MulterModule.register({
      limits: {
        fileSize: 10 * 1024 * 1024, 
      },
    }),
  ],
  controllers: [RagController],
  providers: [RagService],
})
export class RagModule {}