

import React, { useState, useRef, useEffect } from 'react';
import { useSelector } from 'react-redux'; 
import { ragService } from '../services/rag.service';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Layout from '../components/layout/Layout';
import type { RootState } from '../store/store'; 

const AIChatPage = () => {
  const { user } = useSelector((state: RootState) => state.auth);

  const [file, setFile] = useState<File | null>(null);
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    if (!user || !user.id) {
      alert("Vui lòng đăng nhập để upload tài liệu!");
      return;
    }

    setUploading(true);
    try {
      await ragService.uploadFile(file, user.id); 
      alert('Upload và xử lý tài liệu thành công!');
      setFile(null);
    } catch (error) {
      alert('Lỗi khi upload file');
      console.error(error);
    } finally {
      setUploading(false);
    }
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    if (!user || !user.id) {
        setMessages(prev => [...prev, { role: 'ai', content: 'Bạn cần đăng nhập để chat với tài liệu của mình.' }]);
        return;
    }

    const question = input;
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: question }]);
    setLoading(true);

    try {
      const res = await ragService.chat(question, user.id);
      
      setMessages((prev) => [...prev, { role: 'ai', content: res.answer }]);
    } catch (error) {
      console.error(error);
      setMessages((prev) => [...prev, { role: 'ai', content: 'Có lỗi xảy ra khi kết nối với AI.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
        <div className="max-w-6xl mx-auto h-[calc(100vh-100px)] flex flex-col gap-6">
       
       {/* Header Section */}
       <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
         <div>
           <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
             <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
             </svg>
             Trợ lý AI & Tài liệu
           </h1>
           <p className="text-gray-500 text-sm mt-1">Nạp tài liệu PDF và hỏi đáp thông minh với trợ lý ảo</p>
         </div>

         {/* Upload Widget Compact */}
         <div className="flex items-center gap-3 bg-gray-50 p-2 rounded-lg border border-gray-200">
           <div className="relative">
             <input 
               type="file" 
               accept=".pdf"
               onChange={handleFileChange}
               className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
               title="Chọn file PDF"
             />
             <div className={`px-4 py-2 text-sm rounded-md border border-dashed flex items-center gap-2 cursor-pointer transition-colors ${file ? 'bg-indigo-50 border-indigo-300 text-indigo-700' : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-100'}`}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                 </svg>
                <span className="truncate max-w-[150px]">{file ? file.name : 'Chọn file PDF...'}</span>
             </div>
           </div>
           <Button 
             onClick={handleUpload} 
             disabled={!file || uploading}
             className={`px-4 py-2 text-sm ${(!file || uploading) ? 'opacity-50 cursor-not-allowed' : ''}`}
           >
             {uploading ? (
               <span className="flex items-center gap-2">
                 <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                   <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                   <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                 </svg>
                 Xử lý...
               </span>
             ) : 'Upload'}
           </Button>
         </div>
       </div>

       {/* Chat Area */}
       <div className="flex-1 bg-white rounded-xl shadow-lg border border-gray-200 flex flex-col overflow-hidden">
         {/* Messages List */}
         <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50/50">
           {messages.length === 0 ? (
             <div className="h-full flex flex-col items-center justify-center text-gray-400 opacity-60">
               <svg xmlns="http://www.w3.org/2000/svg" className="h-20 w-20 mb-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
               </svg>
               <p className="text-lg font-medium">Chưa có đoạn hội thoại nào</p>
               <p className="text-sm">Hãy upload tài liệu và bắt đầu đặt câu hỏi ngay</p>
             </div>
           ) : (
             messages.map((msg, idx) => (
               <div key={idx} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                 {/* AI Avatar */}
                 {msg.role !== 'user' && (
                   <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center border border-green-200 flex-shrink-0">
                     <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-600" viewBox="0 0 20 20" fill="currentColor">
                       <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
                     </svg>
                   </div>
                 )}

                 <div 
                   className={`max-w-[80%] px-4 py-3 rounded-2xl shadow-sm text-sm leading-relaxed ${
                     msg.role === 'user' 
                       ? 'bg-indigo-600 text-white rounded-br-none' 
                       : 'bg-white text-gray-800 border border-gray-100 rounded-bl-none'
                   }`}
                 >
                   <p className="whitespace-pre-wrap">{msg.content}</p>
                 </div>

                 {/* User Avatar */}
                 {msg.role === 'user' && (
                     <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center border border-indigo-200 flex-shrink-0">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-600" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                      </svg>
                    </div>
                 )}
               </div>
             ))
           )}
           {/* Loading Indicator */}
           {loading && (
             <div className="flex gap-3 justify-start">
                 <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center border border-green-200">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-600" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
                    </svg>
                 </div>
                 <div className="bg-white px-4 py-3 rounded-2xl rounded-bl-none border border-gray-100 shadow-sm flex items-center gap-1">
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></span>
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s'}}></span>
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s'}}></span>
                 </div>
             </div>
           )}
           <div ref={messagesEndRef} />
         </div>

         {/* Input Area */}
         <div className="p-4 bg-white border-t border-gray-200">
           <div className="flex gap-3 max-w-5xl mx-auto">
             <Input 
               value={input} 
               onChange={(e) => setInput(e.target.value)} 
               placeholder="Nhập câu hỏi của bạn về tài liệu..."
               onKeyDown={(e) => e.key === 'Enter' && handleSend()}
               className="flex-1 shadow-sm border-gray-300 focus:ring-indigo-500 focus:border-indigo-500"
             />
             <Button 
               onClick={handleSend} 
               disabled={loading || !input.trim()}
               className="px-6 shadow-sm"
             >
               <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 transform rotate-90" viewBox="0 0 20 20" fill="currentColor">
                 <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
               </svg>
             </Button>
           </div>
           <p className="text-center text-xs text-gray-400 mt-2">
             AI có thể mắc sai sót. Hãy kiểm tra lại thông tin quan trọng.
           </p>
         </div>
       </div>
     </div>
    </Layout>
  );
};

export default AIChatPage;