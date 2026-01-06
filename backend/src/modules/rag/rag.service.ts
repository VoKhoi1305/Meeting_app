

// import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
// import { ChatOllama, OllamaEmbeddings } from "@langchain/ollama";
// import { Chroma } from "@langchain/community/vectorstores/chroma";
// import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";


// const pdfjsLib = require('pdfjs-dist/legacy/build/pdf.js');

// @Injectable()
// export class RagService {
//   private readonly logger = new Logger(RagService.name);

//   private embeddings = new OllamaEmbeddings({
//     model: "nomic-embed-text", 
//     baseUrl: "http://localhost:11434",
//   });

//   private llm = new ChatOllama({
//     model: "llama3", 
//     baseUrl: "http://localhost:11434",
//     temperature: 0.3, 
//   });

//   async processPdf(buffer: Buffer, filename: string) {
//     try {

//       const uint8Array = new Uint8Array(buffer);
      
//       const loadingTask = pdfjsLib.getDocument({ data: uint8Array });
//       const doc = await loadingTask.promise;
      
//       let fullText = '';
//       const numPages = doc.numPages;

//       for (let i = 1; i <= numPages; i++) {
//         const page = await doc.getPage(i);
//         const textContent = await page.getTextContent();
        
//         const pageText = textContent.items.map((item: any) => item.str).join(' ');
//         fullText += pageText + '\n\n';
//       }
//       // ------------------------------------------

//       if (!fullText || fullText.trim().length === 0) {
//         throw new Error('File PDF không có nội dung text (có thể là file ảnh scan).');
//       }
//       this.logger.log(`✅ Đã đọc được ${fullText.length} ký tự từ ${numPages} trang.`);

//       this.logger.log('2️⃣  Đang chia nhỏ văn bản...');
//       const splitter = new RecursiveCharacterTextSplitter({
//         chunkSize: 1000,    
//         chunkOverlap: 200,  
//       });
      
//       const docs = await splitter.createDocuments([fullText], [{ source: filename }]);

//       await Chroma.fromDocuments(docs, this.embeddings, {
//         collectionName: "meeting-docs",
//         url: "http://localhost:8000",
//       });
      
//       return { message: "Đã học xong tài liệu: " + filename };

//     } catch (error) {
//       this.logger.error(` LỖI XỬ LÝ FILE: ${error.message}`, error.stack);
      
//       if (error.code === 'ECONNREFUSED') {
//         throw new InternalServerErrorException('Không thể kết nối tới ChromaDB (Port 8000) hoặc Ollama (Port 11434). Hãy kiểm tra Docker/App.');
//       }
      
//       throw new InternalServerErrorException(`Lỗi khi xử lý file: ${error.message}`);
//     }
//   }

//   async askQuestion(question: string) {
//     try {
//       const vectorStore = await Chroma.fromExistingCollection(this.embeddings, {
//         collectionName: "meeting-docs",
//         url: "http://localhost:8000",
//       });

//       const results = await vectorStore.similaritySearch(question, 4);
      
//       if (!results || results.length === 0) {
//         return { answer: "Tôi chưa có thông tin nào về tài liệu này (DB rỗng hoặc không tìm thấy liên quan)." };
//       }

//       const context = results.map((doc) => doc.pageContent).join("\n\n---\n\n");

//       const prompt = `
//         Bạn là một trợ lý AI hỗ trợ tra cứu tài liệu.
//         Dựa vào ngữ cảnh (Context) dưới đây, hãy trả lời câu hỏi của người dùng bằng tiếng Việt.
        
//         Quy tắc quan trọng:
//         - Chỉ dùng thông tin trong Context.
//         - Nếu Context không có câu trả lời, hãy nói "Tôi không tìm thấy thông tin trong tài liệu".
//         - Trình bày rõ ràng, dễ hiểu.

//         [CONTEXT]:
//         ${context}

//         [USER QUESTION]:
//         ${question}

//         [ANSWER]:
//       `;

//       const response = await this.llm.invoke(prompt);
//       return { answer: response.content };

//     } catch (error) {
//       this.logger.error("Lỗi khi Chat:", error);
//       return { answer: "Xin lỗi, hệ thống đang gặp sự cố khi suy nghĩ câu trả lời." };
//     }
//   }
// }

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

  // --- 1. UPLOAD FILE VÀ GẮN NHÃN ---
  async processPdf(buffer: Buffer, filename: string, userId: string, sessionId?: string) {
    try {
      // 1. Kiểm tra thư viện PDF
      if (!pdfjsLib) {
        throw new Error("Thư viện pdfjs-dist chưa được cài đặt đúng. Hãy chạy: npm install pdfjs-dist@2.16.105");
      }

      const sessionLabel = sessionId || 'General';
      this.logger.log(`🚀 User [${userId}] đang upload file: ${filename} vào Session [${sessionLabel}]`);

      // 2. Đọc nội dung PDF
      const uint8Array = new Uint8Array(buffer);
      const loadingTask = pdfjsLib.getDocument({ data: uint8Array });
      const doc = await loadingTask.promise;
      
      let fullText = '';
      const numPages = doc.numPages;

      for (let i = 1; i <= numPages; i++) {
        const page = await doc.getPage(i);
        const textContent = await page.getTextContent();
        // Nối các từ lại thành câu
        const pageText = textContent.items.map((item: any) => item.str).join(' ');
        fullText += pageText + '\n\n';
      }

      // 3. Kiểm tra nội dung rỗng
      if (!fullText || fullText.trim().length === 0) {
        throw new Error('File PDF không có nội dung text (có thể là file ảnh scan).');
      }
      this.logger.log(`✅ Đã đọc được ${fullText.length} ký tự.`);

      // 4. Chia nhỏ văn bản (Chunking)
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

  // --- 2. CHAT VÀ LỌC DỮ LIỆU (FILTERING) ---
  // async askQuestion(question: string, userId: string, sessionId?: string) {
  //   try {
  //     const vectorStore = await Chroma.fromExistingCollection(this.embeddings, {
  //       collectionName: this.COLLECTION_NAME,
  //       url: "http://localhost:8000",
  //     });

  //     // Tạo bộ lọc: Chỉ tìm trong tài liệu của User đó
  //     const filter: Record<string, any> = {
  //       "$and": [
  //         { "userId": userId }
  //       ]
  //     };

  //     // Nếu có session, lọc thêm session
  //     if (sessionId) {
  //       filter["$and"].push({ "sessionId": sessionId });
  //     }

  //     this.logger.log(`🔍 Đang tìm kiếm với Filter: ${JSON.stringify(filter)}`);

  //     // Tìm kiếm vector tương đồng
  //     const results = await vectorStore.similaritySearch(question, 4, filter);
      
  //     if (!results || results.length === 0) {
  //       return { 
  //         answer: "Dựa trên tài liệu bạn tải lên, tôi không tìm thấy thông tin phù hợp.",
  //         sources: []
  //       };
  //     }

  //     const context = results.map((doc) => doc.pageContent).join("\n\n---\n\n");
  //     const sources = [...new Set(results.map(doc => doc.metadata.source))];

  //     const prompt = `
  //       Bạn là một trợ lý AI hỗ trợ tra cứu tài liệu.
  //        Dựa vào ngữ cảnh (Context) dưới đây, hãy trả lời câu hỏi của người dùng bằng tiếng Việt.
        
  //        Quy tắc quan trọng:
  //       - Chỉ dùng thông tin trong Context.
  //       - Nếu Context không có câu trả lời, hãy nói "Tôi không tìm thấy thông tin trong tài liệu".
  //       - Trình bày rõ ràng, dễ hiểu.

  //       [CONTEXT]:
  //        ${context}
  //        [USER QUESTION]:
  //       ${question}
  //       [ANSWER]:
  //     `;

  //     const response = await this.llm.invoke(prompt);
      
  //     return { 
  //       answer: response.content,
  //       sources: sources
  //     };

  //   } catch (error) {
  //     this.logger.error("Lỗi Chat:", error);
  //     return { answer: "Xin lỗi, hệ thống đang gặp sự cố khi xử lý câu hỏi." };
  //   }
  // }
  async askQuestion(question: string, userId: string, sessionId?: string) {
    try {
      const vectorStore = await Chroma.fromExistingCollection(this.embeddings, {
        collectionName: this.COLLECTION_NAME,
        url: "http://localhost:8000",
      });

      // 🔥 FIX LỖI: Không dùng $and nữa mà dùng object thường.
      // ChromaDB sẽ tự hiểu: Lấy vector có userId == userId VÀ sessionId == sessionId (nếu có)
      const filter: Record<string, any> = {
        userId: userId,
      };

      // Nếu có sessionId thì mới thêm vào bộ lọc
      if (sessionId) {
        filter.sessionId = sessionId;
      }

      this.logger.log(`🔍 Đang tìm kiếm với Filter: ${JSON.stringify(filter)}`);

      // Gọi hàm search với bộ lọc đã sửa
      const results = await vectorStore.similaritySearch(question, 4, filter);
      
      if (!results || results.length === 0) {
        return { 
          answer: "Dựa trên tài liệu bạn tải lên, tôi không tìm thấy thông tin phù hợp.",
          sources: []
        };
      }

      // ... (Đoạn xử lý Prompt và gọi LLM giữ nguyên như cũ) ...
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
  // --- 3. DEBUG STATUS (Đã sửa lỗi TypeScript undefined) ---
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