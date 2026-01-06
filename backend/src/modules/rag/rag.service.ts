

import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { ChatOllama, OllamaEmbeddings } from "@langchain/ollama";
import { Chroma } from "@langchain/community/vectorstores/chroma";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";


const pdfjsLib = require('pdfjs-dist/legacy/build/pdf.js');

@Injectable()
export class RagService {
  private readonly logger = new Logger(RagService.name);

  private embeddings = new OllamaEmbeddings({
    model: "nomic-embed-text", 
    baseUrl: "http://localhost:11434",
  });

  private llm = new ChatOllama({
    model: "llama3", 
    baseUrl: "http://localhost:11434",
    temperature: 0.3, 
  });

  async processPdf(buffer: Buffer, filename: string) {
    try {

      const uint8Array = new Uint8Array(buffer);
      
      const loadingTask = pdfjsLib.getDocument({ data: uint8Array });
      const doc = await loadingTask.promise;
      
      let fullText = '';
      const numPages = doc.numPages;

      for (let i = 1; i <= numPages; i++) {
        const page = await doc.getPage(i);
        const textContent = await page.getTextContent();
        
        const pageText = textContent.items.map((item: any) => item.str).join(' ');
        fullText += pageText + '\n\n';
      }
      // ------------------------------------------

      if (!fullText || fullText.trim().length === 0) {
        throw new Error('File PDF không có nội dung text (có thể là file ảnh scan).');
      }
      this.logger.log(`✅ Đã đọc được ${fullText.length} ký tự từ ${numPages} trang.`);

      this.logger.log('2️⃣  Đang chia nhỏ văn bản...');
      const splitter = new RecursiveCharacterTextSplitter({
        chunkSize: 1000,    
        chunkOverlap: 200,  
      });
      
      const docs = await splitter.createDocuments([fullText], [{ source: filename }]);

      await Chroma.fromDocuments(docs, this.embeddings, {
        collectionName: "meeting-docs",
        url: "http://localhost:8000",
      });
      
      return { message: "Đã học xong tài liệu: " + filename };

    } catch (error) {
      this.logger.error(` LỖI XỬ LÝ FILE: ${error.message}`, error.stack);
      
      if (error.code === 'ECONNREFUSED') {
        throw new InternalServerErrorException('Không thể kết nối tới ChromaDB (Port 8000) hoặc Ollama (Port 11434). Hãy kiểm tra Docker/App.');
      }
      
      throw new InternalServerErrorException(`Lỗi khi xử lý file: ${error.message}`);
    }
  }

  async askQuestion(question: string) {
    try {
      const vectorStore = await Chroma.fromExistingCollection(this.embeddings, {
        collectionName: "meeting-docs",
        url: "http://localhost:8000",
      });

      const results = await vectorStore.similaritySearch(question, 4);
      
      if (!results || results.length === 0) {
        return { answer: "Tôi chưa có thông tin nào về tài liệu này (DB rỗng hoặc không tìm thấy liên quan)." };
      }

      const context = results.map((doc) => doc.pageContent).join("\n\n---\n\n");

      const prompt = `
        Bạn là một trợ lý AI hỗ trợ tra cứu tài liệu.
        Dựa vào ngữ cảnh (Context) dưới đây, hãy trả lời câu hỏi của người dùng bằng tiếng Việt.
        
        Quy tắc quan trọng:
        - Chỉ dùng thông tin trong Context.
        - Nếu Context không có câu trả lời, hãy nói "Tôi không tìm thấy thông tin trong tài liệu".
        - Trình bày rõ ràng, dễ hiểu.

        [CONTEXT]:
        ${context}

        [USER QUESTION]:
        ${question}

        [ANSWER]:
      `;

      const response = await this.llm.invoke(prompt);
      return { answer: response.content };

    } catch (error) {
      this.logger.error("Lỗi khi Chat:", error);
      return { answer: "Xin lỗi, hệ thống đang gặp sự cố khi suy nghĩ câu trả lời." };
    }
  }
}