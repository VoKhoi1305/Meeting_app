// import api from './api';

// export const ragService = {
//   uploadFile: async (file: File) => {
//     const formData = new FormData();
//     formData.append('file', file);
//     const response = await api.post('/rag/upload', formData, {
//       headers: { 'Content-Type': 'multipart/form-data' },
//     });
//     return response.data;
//   },

//   chat: async (question: string) => {
//     const response = await api.post('/rag/chat', { question });
//     return response.data;
//   },
// };

import api from './api';

export const ragService = {
  uploadFile: async (file: File, userId: string) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('userId', userId); 

    const response = await api.post('/rag/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  chat: async (question: string, userId: string) => {
    const response = await api.post('/rag/chat', { 
      question,
      userId 
    });
    return response.data;
  },
};