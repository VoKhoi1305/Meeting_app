

import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { ChatOllama, OllamaEmbeddings } from "@langchain/ollama";
import { Chroma } from "@langchain/community/vectorstores/chroma";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
let pdfjsLib: any;
try {
  pdfjsLib = require('pdfjs-dist/legacy/build/pdf.js');
} catch (error) {
  // Fallback nếu không tìm thấy path legacy
  try {
    pdfjsLib = require('pdfjs-dist/build/pdf.js');
  } catch (e) {
    console.error('❌ Không tìm thấy thư viện pdfjs-dist. Vui lòng chạy: npm install pdfjs-dist@2.16.105');
  }
}

@Injectable()
export class RagService {
  private readonly logger = new Logger(RagService.name);
  private readonly COLLECTION_NAME = "meeting-docs"; 

  private embeddings = new OllamaEmbeddings({
    model: "nomic-embed-text", 
    baseUrl: "http://localhost:11434",
  });

  private llm = new ChatOllama({
    model: "llama3", 
    baseUrl: "http://localhost:11434",
    temperature: 0.3, 
  });

  async processPdf(buffer: Buffer, filename: string, userId: string, sessionId?: string) {
    try {
      if (!pdfjsLib) {
        throw new Error("loi thu vien");
      }

      const sessionLabel = sessionId || 'General';

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

      if (!fullText || fullText.trim().length === 0) {
        throw new Error('File PDF không có nội dung text.');
      }

      const splitter = new RecursiveCharacterTextSplitter({
        chunkSize: 1000,    
        chunkOverlap: 200,  
      });
      
      const rawDocs = await splitter.createDocuments([fullText]);

      const docsWithMetadata = rawDocs.map((d) => ({
        ...d,
        metadata: {
          source: filename,
          userId: userId,                 
          sessionId: sessionId || "ALL",
          createdAt: new Date().toISOString()
        }
      }));

   
      await Chroma.fromDocuments(docsWithMetadata, this.embeddings, {
        collectionName: this.COLLECTION_NAME,
        url: "http://localhost:8000",
      });
      
      this.logger.log(`✅ Đã lưu ${docsWithMetadata.length} vectors cho User: ${userId}`);
      
      return { 
        message: "Xử lý thành công", 
        filename: filename,
        chunks: docsWithMetadata.length 
      };

    } catch (error) {
      this.logger.error(`❌ LỖI UPLOAD: ${error.message}`, error.stack);
      throw new InternalServerErrorException(`Lỗi xử lý file: ${error.message}`);
    }
  }

 
  async askQuestion(question: string, userId: string, sessionId?: string) {
    try {
      const vectorStore = await Chroma.fromExistingCollection(this.embeddings, {
        collectionName: this.COLLECTION_NAME,
        url: "http://localhost:8000",
      });

  
      const filter: Record<string, any> = {
        userId: userId,
      };

      if (sessionId) {
        filter.sessionId = sessionId;
      }

      const results = await vectorStore.similaritySearch(question, 4, filter);
      
      if (!results || results.length === 0) {
        return { 
          answer: "Dựa trên tài liệu bạn tải lên, tôi không tìm thấy thông tin phù hợp.",
          sources: []
        };
      }

      const context = results.map((doc) => doc.pageContent).join("\n\n---\n\n");
      const sources = [...new Set(results.map(doc => doc.metadata.source))];

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
      
      return { 
        answer: response.content,
        sources: sources
      };

    } catch (error) {
      this.logger.error("Lỗi Chat:", error);
      return { answer: "Xin lỗi, hệ thống đang gặp sự cố khi trích xuất dữ liệu." };
    }
  }
  async checkDatabaseStats() {
    try {
      const vectorStore = await Chroma.fromExistingCollection(this.embeddings, {
        collectionName: this.COLLECTION_NAME,
        url: "http://localhost:8000",
      });
      
      const collection = vectorStore.collection;
      
      if (!collection) {
        return { 
          status: "Warning", 
          message: "Chưa kết nối được Collection (có thể chưa có dữ liệu nào)." 
        };
      }

      const count = await collection.count();
      return { status: "OK", total_vectors: count };
    } catch (e) {
      return { status: "Error", msg: e.message };
    }
  }
}