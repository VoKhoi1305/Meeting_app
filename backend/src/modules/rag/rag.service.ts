

import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { ChatOllama, OllamaEmbeddings } from "@langchain/ollama";
import { Chroma } from "@langchain/community/vectorstores/chroma";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
let pdfjsLib: any;
try {
  pdfjsLib = require('pdfjs-dist/legacy/build/pdf.js');
} catch (error) {
  try {
    pdfjsLib = require('pdfjs-dist/build/pdf.js');
  } catch (e) {
    console.error('Failed to load pdfjs-dist library:', e);
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
        throw new Error("lib erorr");
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
        throw new Error('PDF file does not contain any text.');
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
      
      // this.logger.log(` Đã lưu ${docsWithMetadata.length} vectors cho User: ${userId}`);
      
      return { 
        message: "Xử lý thành công", 
        filename: filename,
        chunks: docsWithMetadata.length 
      };

    } catch (error) {
      throw new InternalServerErrorException(`file erorr: ${error.message}`);
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
          answer: "I can't find relevant information in the documents.",
          sources: []
        };
      }

      const context = results.map((doc) => doc.pageContent).join("\n\n---\n\n");
      const sources = [...new Set(results.map(doc => doc.metadata.source))];

      const prompt = `
    ### SYSTEM ROLE
    You are a trusted document analysis assistant. Your goal is to provide accurate answers based EXCLUSIVELY on the provided documents.

    ### INSTRUCTIONS
    1. Analyze the provided [Context] carefully.
    2. Answer the [User Question] using only the information from the [Context].
    3. Hallucination Check: If the context does not contain the answer, you MUST respond with: "I cannot find the information in the provided documents." Do NOT use your internal knowledge base or make assumptions.
    4. Be concise and clear in your response.
    5. **Language:** Provide the final answer in English.

    ### DATA
    [Context]:
    ${context}

    [User Question]:
    ${question}

    ### RESPONSE
       `;


      const response = await this.llm.invoke(prompt);
      
      return { 
        answer: response.content,
        sources: sources
      };

    } catch (error) {
      // this.logger.error("Lỗi Chat:", error);
      return { answer: "system error when answer" };
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
          message: "cannot connect to collection." 
        };
      }

      const count = await collection.count();
      return { status: "OK", total_vectors: count };
    } catch (e) {
      return { status: "Error", msg: e.message };
    }
  }
}