# Tài Liệu Hệ Thống Meeting App

## 📋 Mục Lục
- [Giới Thiệu](#giới-thiệu)
- [Chức Năng Chính](#chức-năng-chính)
- [Kiến Trúc Hệ Thống](#kiến-trúc-hệ-thống)
- [Cấu Trúc Thư Mục](#cấu-trúc-thư-mục)
- [Công Nghệ Sử Dụng](#công-nghệ-sử-dụng)
- [Kiến Thức Liên Quan](#kiến-thức-liên-quan)
- [Hướng Dẫn Cài Đặt](#hướng-dẫn-cài-đặt)
- [Hướng Dẫn Chạy Ứng Dụng](#hướng-dẫn-chạy-ứng-dụng)

---

## 🎯 Giới Thiệu

**Meeting App** là một ứng dụng hội nghị trực tuyến toàn diện, được xây dựng với kiến trúc **Full-stack TypeScript**, kết hợp công nghệ **WebRTC** cho video call và **AI/RAG** cho trợ lý thông minh.

Ứng dụng cho phép người dùng:
- Tạo và tham gia phòng họp trực tuyến
- Giao tiếp video/audio real-time
- Chuyển đổi giọng nói thành văn bản (Speech-to-Text)
- Trò chuyện với AI về tài liệu cuộc họp
- Quản lý người dùng và phiên họp

---

## ✨ Chức Năng Chính

### 1. **Xác Thực & Quản Lý Người Dùng**
- Đăng ký và đăng nhập tài khoản
- Xác thực JWT (JSON Web Token)
- Phân quyền người dùng (User/Admin)
- Quản lý hồ sơ cá nhân

### 2. **Quản Lý Cuộc Họp**
- Tạo phòng họp với mã code duy nhất
- Tham gia phòng họp qua Room Code hoặc Room ID
- Theo dõi trạng thái cuộc họp (Waiting, Active, Ended)
- Quản lý danh sách người tham gia
- Kết thúc cuộc họp (chỉ host)

### 3. **WebRTC Video Conference**
- Video call real-time peer-to-peer
- Audio streaming
- Điều khiển camera/microphone
- Background blur/replacement (MediaPipe)
- Hiển thị nhiều người tham gia
- Tự động kết nối và ngắt kết nối

### 4. **Speech-to-Text (STT)**
- Chuyển đổi giọng nói thành văn bản real-time
- Sử dụng Sherpa-ONNX với model Zipformer
- Hiển thị phụ đề trực tiếp trong cuộc họp
- Đồng bộ phụ đề cho tất cả người tham gia

### 5. **RAG (Retrieval-Augmented Generation) AI Chat**
- Upload tài liệu PDF
- Trích xuất và lưu trữ vector embeddings
- Hỏi đáp thông minh dựa trên tài liệu
- Lọc theo user và session
- Sử dụng Ollama LLM (Llama3)

### 6. **Admin Panel**
- Quản lý toàn bộ người dùng
- Xem thống kê hệ thống
- Quản lý cuộc họp

---

## 🏗️ Kiến Trúc Hệ Thống

```
┌─────────────────────────────────────────────────────────────┐
│                        FRONTEND                              │
│  React + TypeScript + Redux + Socket.IO Client              │
│  - UI Components (Auth, Meeting, Video, Settings)           │
│  - State Management (Redux Toolkit)                         │
│  - WebRTC Peer Connections                                  │
│  - Speech-to-Text Processing                                │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  │ HTTP/REST API + WebSocket
                  │
┌─────────────────▼───────────────────────────────────────────┐
│                        BACKEND                               │
│  NestJS + TypeScript + Socket.IO Server                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Auth Module  │  │Meeting Module│  │ WebRTC Module│      │
│  │ - JWT Auth   │  │ - CRUD       │  │ - Signaling  │      │
│  │ - Guards     │  │ - Validation │  │ - P2P Setup  │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│  ┌──────────────┐  ┌──────────────┐                         │
│  │  RAG Module  │  │ Users Module │                         │
│  │ - PDF Parse  │  │ - User CRUD  │                         │
│  │ - Embeddings │  │ - Profiles   │                         │
│  └──────────────┘  └──────────────┘                         │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  │
┌─────────────────▼───────────────────────────────────────────┐
│                   EXTERNAL SERVICES                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  PostgreSQL  │  │  ChromaDB    │  │   Ollama     │      │
│  │  (Database)  │  │  (Vectors)   │  │   (LLM)      │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
```

### Luồng Hoạt Động

1. **Authentication Flow**
   - User đăng ký/đăng nhập → Backend xác thực → Trả về JWT token
   - Token được lưu trong Redux store và localStorage
   - Mọi request sau đó đều gửi kèm token trong header

2. **Meeting Flow**
   - Host tạo meeting → Backend tạo Room Code/ID duy nhất
   - Participants join bằng Room Code → Backend validate và thêm vào DB
   - WebSocket kết nối → Tham gia room → Nhận danh sách participants

3. **WebRTC Flow**
   - Client A join room → Nhận danh sách existing participants
   - Client A tạo offer → Gửi qua signaling server → Client B nhận offer
   - Client B tạo answer → Gửi lại Client A
   - ICE candidates được trao đổi → Thiết lập P2P connection
   - Media streams được truyền trực tiếp giữa peers

4. **RAG Flow**
   - User upload PDF → Backend parse text → Split thành chunks
   - Chunks được embed → Lưu vào ChromaDB với metadata (userId, sessionId)
   - User hỏi → Tìm kiếm similarity → Lấy context → LLM trả lời

---

## 📁 Cấu Trúc Thư Mục

### Backend Structure

```
backend/
├── src/
│   ├── modules/                    # Các module chức năng
│   │   ├── auth/                   # Module xác thực
│   │   │   ├── auth.controller.ts  # API endpoints (login, register)
│   │   │   ├── auth.service.ts     # Business logic
│   │   │   ├── auth.module.ts      # Module definition
│   │   │   ├── guards/             # JWT guards
│   │   │   ├── strategies/         # Passport strategies
│   │   │   └── dto/                # Data Transfer Objects
│   │   │
│   │   ├── meetings/               # Module quản lý cuộc họp
│   │   │   ├── meetings.controller.ts  # REST API
│   │   │   ├── meetings.service.ts     # Logic tạo/join/end meeting
│   │   │   ├── meetings.gateway.ts     # WebSocket gateway
│   │   │   ├── entities/               # TypeORM entities
│   │   │   │   ├── meeting.entity.ts
│   │   │   │   └── participant.entity.ts
│   │   │   └── dto/
│   │   │
│   │   ├── webrtc/                 # Module WebRTC signaling
│   │   │   ├── webrtc.gateway.ts   # WebSocket cho signaling
│   │   │   ├── webrtc.service.ts
│   │   │   └── dto/
│   │   │
│   │   ├── rag/                    # Module RAG AI
│   │   │   ├── rag.controller.ts   # Upload PDF, ask questions
│   │   │   ├── rag.service.ts      # LangChain, ChromaDB logic
│   │   │   └── dto/
│   │   │
│   │   └── users/                  # Module quản lý user
│   │       ├── users.controller.ts
│   │       ├── users.service.ts
│   │       ├── entities/
│   │       └── dto/
│   │
│   ├── common/                     # Shared resources
│   │   ├── decorators/             # Custom decorators
│   │   ├── enums/                  # Enums (MeetingStatus, etc.)
│   │   ├── filters/                # Exception filters
│   │   └── interceptors/           # HTTP interceptors
│   │
│   ├── config/                     # Configuration files
│   │   ├── database.config.ts      # PostgreSQL config
│   │   ├── jwt.config.ts           # JWT config
│   │   └── webrtc.config.ts        # WebRTC config
│   │
│   ├── utils/                      # Utility functions
│   │   └── code-generator.util.ts  # Generate Room Code/ID
│   │
│   ├── app.module.ts               # Root module
│   └── main.ts                     # Entry point
│
├── test/                           # Test files
├── dist/                           # Compiled output
├── package.json                    # Dependencies
└── tsconfig.json                   # TypeScript config
```

### Frontend Structure

```
frontend/
├── src/
│   ├── pages/                      # Page components
│   │   ├── Home.tsx                # Landing page
│   │   ├── Login.tsx               # Login page
│   │   ├── Register.tsx            # Register page
│   │   ├── Dashboard.tsx           # User dashboard
│   │   ├── AdminPanel.tsx          # Admin panel
│   │   ├── AIChatPage.tsx          # RAG chat interface
│   │   └── MeetingRoom/            # Meeting room pages
│   │       ├── index.tsx           # Main meeting room
│   │       └── JoinMeeting.tsx     # Join meeting page
│   │
│   ├── components/                 # Reusable components
│   │   ├── auth/                   # Auth components
│   │   │   └── ProtectedRoute.tsx  # Route guard
│   │   ├── common/                 # Common UI components
│   │   │   └── Loading.tsx
│   │   ├── layout/                 # Layout components
│   │   │   └── Layout.tsx          # Main layout wrapper
│   │   ├── meeting/                # Meeting UI components
│   │   ├── settings/               # Settings components
│   │   └── video/                  # Video components
│   │
│   ├── hooks/                      # Custom React hooks
│   │   ├── useMediaStream.ts       # Camera/mic access
│   │   ├── useMeeting.ts           # Meeting logic
│   │   ├── useWebRTC.ts            # WebRTC peer connections
│   │   ├── useSpeechToText.ts      # STT processing
│   │   └── useZipformer.ts         # Zipformer model
│   │
│   ├── services/                   # API services
│   │   ├── api.ts                  # Axios instance
│   │   ├── auth.service.ts         # Auth API calls
│   │   ├── meeting.service.ts      # Meeting API calls
│   │   ├── user.service.ts         # User API calls
│   │   ├── rag.service.ts          # RAG API calls
│   │   └── websocket.service.ts    # Socket.IO client
│   │
│   ├── store/                      # Redux store
│   │   ├── store.ts                # Store configuration
│   │   └── slices/                 # Redux slices
│   │       └── authSlice.ts        # Auth state
│   │
│   ├── types/                      # TypeScript types
│   │   ├── auth.types.ts
│   │   ├── meeting.types.ts
│   │   ├── participant.types.ts
│   │   ├── user.types.ts
│   │   ├── webrtc.types.ts
│   │   ├── mediapipe.d.ts          # MediaPipe types
│   │   └── sherpa-onnx.d.ts        # Sherpa types
│   │
│   ├── constants/                  # Constants
│   │   ├── meeting.constants.ts
│   │   └── webrtc.constants.ts
│   │
│   ├── utils/                      # Utility functions
│   │   └── background-processing.ts # Background blur/replace
│   │
│   ├── App.tsx                     # Root component
│   ├── main.tsx                    # Entry point
│   └── index.css                   # Global styles
│
├── public/                         # Static assets
├── package.json                    # Dependencies
├── vite.config.ts                  # Vite configuration
├── tailwind.config.js              # Tailwind CSS config
└── tsconfig.json                   # TypeScript config
```

### Chức Năng Các Thư Mục Chính

#### Backend

- **`modules/`**: Chứa các module chức năng độc lập, mỗi module có controller, service, entities, dto
- **`common/`**: Code dùng chung như decorators, enums, filters
- **`config/`**: File cấu hình cho database, JWT, WebRTC
- **`utils/`**: Các hàm tiện ích như generate code

#### Frontend

- **`pages/`**: Các trang chính của ứng dụng
- **`components/`**: Component UI tái sử dụng
- **`hooks/`**: Custom hooks cho logic phức tạp
- **`services/`**: Giao tiếp với backend API
- **`store/`**: Quản lý state toàn cục với Redux
- **`types/`**: TypeScript type definitions

---

## 🛠️ Công Nghệ Sử Dụng

### Backend Technologies

| Công Nghệ | Phiên Bản | Mục Đích |
|-----------|-----------|----------|
| **NestJS** | ^11.0.1 | Framework backend Node.js |
| **TypeScript** | ^5.7.3 | Ngôn ngữ lập trình |
| **TypeORM** | ^0.3.27 | ORM cho PostgreSQL |
| **PostgreSQL** | ^8.16.3 | Database quan hệ |
| **Socket.IO** | ^4.8.1 | WebSocket real-time |
| **Passport JWT** | ^4.0.1 | Xác thực JWT |
| **Bcrypt** | ^6.0.0 | Mã hóa mật khẩu |
| **LangChain** | ^1.2.4 | Framework RAG |
| **ChromaDB** | ^3.2.0 | Vector database |
| **Ollama** | ^1.1.0 | Local LLM runtime |
| **PDF.js** | ^2.16.105 | Parse PDF files |
| **Multer** | ^2.0.2 | Upload file handling |

### Frontend Technologies

| Công Nghệ | Phiên Bản | Mục Đích |
|-----------|-----------|----------|
| **React** | ^19.2.0 | UI library |
| **TypeScript** | ~5.9.3 | Ngôn ngữ lập trình |
| **Vite** | 7.2.2 | Build tool |
| **Redux Toolkit** | ^2.10.1 | State management |
| **React Router** | ^7.9.6 | Routing |
| **Tailwind CSS** | ^3.4.15 | CSS framework |
| **Axios** | ^1.13.2 | HTTP client |
| **Socket.IO Client** | ^4.8.1 | WebSocket client |
| **MediaPipe** | ^0.1.1675465747 | Background segmentation |
| **Sherpa-ONNX** | ^1.12.20 | Speech-to-Text |
| **Lucide React** | ^0.554.0 | Icon library |
| **React Hot Toast** | ^2.6.0 | Notifications |

---

## 📚 Kiến Thức Liên Quan

### 1. **WebRTC (Web Real-Time Communication)**

WebRTC là công nghệ cho phép truyền tải audio, video và data trực tiếp giữa các trình duyệt mà không cần server trung gian.

**Các khái niệm chính:**

- **Peer Connection**: Kết nối trực tiếp giữa 2 peers
- **Media Stream**: Luồng audio/video từ camera/microphone
- **SDP (Session Description Protocol)**: Mô tả cấu hình media session
  - **Offer**: Peer A gửi đề xuất kết nối
  - **Answer**: Peer B phản hồi chấp nhận
- **ICE (Interactive Connectivity Establishment)**: Tìm đường đi tốt nhất để kết nối
  - **ICE Candidates**: Các địa chỉ IP có thể dùng để kết nối
  - **STUN Server**: Tìm public IP của client
  - **TURN Server**: Relay traffic khi P2P không thể

**Luồng hoạt động:**
```
Peer A                  Signaling Server              Peer B
  |                            |                         |
  |--- Create Offer ---------> |                         |
  |                            |--- Forward Offer -----> |
  |                            |                         |
  |                            | <--- Create Answer ---- |
  | <--- Forward Answer ------ |                         |
  |                            |                         |
  |--- ICE Candidates -------> |--- ICE Candidates ----> |
  | <--- ICE Candidates ------ | <--- ICE Candidates --- |
  |                            |                         |
  |<=========== Direct P2P Connection =================> |
```

### 2. **JWT (JSON Web Token)**

JWT là chuẩn mở (RFC 7519) để truyền thông tin an toàn giữa các bên dưới dạng JSON object.

**Cấu trúc JWT:**
```
Header.Payload.Signature
```

- **Header**: Loại token và thuật toán mã hóa (HS256, RS256)
- **Payload**: Dữ liệu người dùng (userId, email, role)
- **Signature**: Chữ ký xác thực tính toàn vẹn

**Ví dụ:**
```typescript
// Backend tạo token
const token = jwt.sign(
  { userId: user.id, email: user.email },
  'SECRET_KEY',
  { expiresIn: '7d' }
);

// Frontend gửi token trong header
headers: { Authorization: `Bearer ${token}` }

// Backend verify token
const payload = jwt.verify(token, 'SECRET_KEY');
```

### 3. **WebSocket & Socket.IO**

WebSocket là giao thức full-duplex cho phép giao tiếp 2 chiều real-time giữa client và server.

**So sánh với HTTP:**
- HTTP: Request-Response (1 chiều)
- WebSocket: Bidirectional (2 chiều), persistent connection

**Socket.IO** là thư viện wrapper của WebSocket với các tính năng:
- Auto-reconnection
- Room/Namespace support
- Fallback to HTTP long-polling
- Broadcasting

**Ví dụ:**
```typescript
// Server
io.on('connection', (socket) => {
  socket.join('room-123');
  socket.to('room-123').emit('new-user', { userId });
});

// Client
socket.emit('join-room', { roomId: '123' });
socket.on('new-user', (data) => console.log(data));
```

### 4. **RAG (Retrieval-Augmented Generation)**

RAG là kỹ thuật AI kết hợp retrieval (tìm kiếm) và generation (sinh văn bản) để trả lời câu hỏi dựa trên tài liệu.

**Quy trình RAG:**

1. **Indexing Phase** (Chuẩn bị dữ liệu)
   - Load documents (PDF, text)
   - Split thành chunks nhỏ (1000 chars)
   - Embed chunks thành vectors (768 dimensions)
   - Lưu vào vector database (ChromaDB)

2. **Retrieval Phase** (Tìm kiếm)
   - User hỏi câu hỏi
   - Embed câu hỏi thành vector
   - Tìm kiếm similarity với vectors trong DB
   - Lấy top-k chunks liên quan nhất

3. **Generation Phase** (Sinh câu trả lời)
   - Tạo prompt với context từ chunks
   - Gửi prompt đến LLM (Llama3)
   - LLM sinh câu trả lời dựa trên context

**Ví dụ:**
```typescript
// 1. Embed document
const docs = await splitter.createDocuments([pdfText]);
await Chroma.fromDocuments(docs, embeddings);

// 2. Retrieve
const results = await vectorStore.similaritySearch(question, 4);
const context = results.map(doc => doc.pageContent).join('\n');

// 3. Generate
const prompt = `Context: ${context}\nQuestion: ${question}\nAnswer:`;
const answer = await llm.invoke(prompt);
```

### 5. **Speech-to-Text (STT)**

STT là công nghệ chuyển đổi giọng nói thành văn bản.

**Sherpa-ONNX** là thư viện STT offline sử dụng model Zipformer:
- Chạy hoàn toàn trên browser (WASM)
- Không cần internet
- Latency thấp
- Hỗ trợ nhiều ngôn ngữ

**Quy trình:**
```typescript
// 1. Capture audio từ microphone
const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

// 2. Process audio với AudioContext
const audioContext = new AudioContext();
const source = audioContext.createMediaStreamSource(stream);

// 3. Feed audio vào Zipformer model
recognizer.acceptWaveform(audioData);
const text = recognizer.getResult();

// 4. Emit text qua WebSocket
socket.emit('send-subtitle', { roomId, text });
```

### 6. **TypeORM**

TypeORM là ORM (Object-Relational Mapping) cho TypeScript/JavaScript.

**Các khái niệm:**

- **Entity**: Class đại diện cho table trong DB
- **Repository**: Interface để thao tác với entity
- **Relations**: Mối quan hệ giữa các entities
  - OneToMany: 1 meeting có nhiều participants
  - ManyToOne: Nhiều participants thuộc 1 meeting
  - OneToOne: 1 user có 1 profile

**Ví dụ:**
```typescript
@Entity()
export class Meeting {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @OneToMany(() => Participant, participant => participant.meeting)
  participants: Participant[];

  @ManyToOne(() => User, user => user.hostedMeetings)
  host: User;
}
```

### 7. **Redux Toolkit**

Redux Toolkit là thư viện chính thức để quản lý state trong React.

**Các khái niệm:**

- **Store**: Nơi lưu trữ toàn bộ state
- **Slice**: Một phần của state với reducers
- **Action**: Sự kiện trigger thay đổi state
- **Reducer**: Hàm xử lý action và cập nhật state
- **Selector**: Hàm lấy data từ state

**Ví dụ:**
```typescript
// Create slice
const authSlice = createSlice({
  name: 'auth',
  initialState: { user: null, token: null },
  reducers: {
    setUser: (state, action) => {
      state.user = action.payload;
    }
  }
});

// Dispatch action
dispatch(setUser({ id: 1, email: 'user@example.com' }));

// Select state
const user = useSelector((state: RootState) => state.auth.user);
```

---

## 🚀 Hướng Dẫn Cài Đặt

### Yêu Cầu Hệ Thống

- **Node.js**: >= 18.x
- **npm**: >= 9.x
- **PostgreSQL**: >= 14.x
- **Ollama**: Latest version
- **ChromaDB**: Latest version

### Bước 1: Clone Repository

```bash
git clone https://github.com/VoKhoi1305/Meeting_app.git
cd Meeting_app
```

### Bước 2: Cài Đặt PostgreSQL

#### Windows:
1. Download PostgreSQL từ [postgresql.org](https://www.postgresql.org/download/)
2. Cài đặt và khởi động PostgreSQL service
3. Tạo database:
```bash
psql -U postgres
CREATE DATABASE meeting_db;
\q
```

#### Linux/Mac:
```bash
# Ubuntu/Debian
sudo apt-get install postgresql postgresql-contrib

# Mac
brew install postgresql

# Tạo database
createdb meeting_db
```

### Bước 3: Cài Đặt Ollama

#### Windows:
1. Download từ [ollama.ai](https://ollama.ai/download)
2. Cài đặt và chạy Ollama
3. Pull models:
```bash
ollama pull llama3
ollama pull nomic-embed-text
```

#### Linux/Mac:
```bash
curl -fsSL https://ollama.ai/install.sh | sh
ollama pull llama3
ollama pull nomic-embed-text
```

### Bước 4: Cài Đặt ChromaDB

```bash
pip install chromadb
```

Hoặc chạy với Docker:
```bash
docker pull chromadb/chroma
docker run -p 8000:8000 chromadb/chroma
```

### Bước 5: Cài Đặt Dependencies

#### Backend:
```bash
cd backend
npm install
```

#### Frontend:
```bash
cd frontend
npm install
```

### Bước 6: Cấu Hình Environment Variables

#### Backend `.env`:
Tạo file `backend/.env`:
```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=your_password
DB_DATABASE=meeting_db

# JWT
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
JWT_EXPIRES_IN=7d

# Server
PORT=3000
NODE_ENV=development

# Ollama
OLLAMA_BASE_URL=http://localhost:11434

# ChromaDB
CHROMA_URL=http://localhost:8000
```

#### Frontend `.env` (nếu cần):
Tạo file `frontend/.env`:
```env
VITE_API_URL=http://localhost:3000
VITE_WS_URL=http://localhost:3000
```

---

## ▶️ Hướng Dẫn Chạy Ứng Dụng

### Chạy Services Bên Ngoài

#### 1. Khởi động PostgreSQL
```bash
# Windows
# PostgreSQL service tự động chạy sau khi cài đặt

# Linux
sudo service postgresql start

# Mac
brew services start postgresql
```

#### 2. Khởi động Ollama
```bash
# Windows/Linux/Mac
ollama serve
```

#### 3. Khởi động ChromaDB
```bash
# Nếu dùng Docker
docker run -p 8000:8000 chromadb/chroma

# Nếu dùng Python
chroma run --host localhost --port 8000
```

### Chạy Backend

```bash
cd backend

# Development mode (auto-reload)
npm run start:dev

# Production mode
npm run build
npm run start:prod
```

Backend sẽ chạy tại: `http://localhost:3000`

### Chạy Frontend

```bash
cd frontend

# Development mode
npm run dev

# Build production
npm run build
npm run preview
```

Frontend sẽ chạy tại: `http://localhost:5173`

### Kiểm Tra Kết Nối

1. **Backend Health Check**: 
   - Mở `http://localhost:3000`
   - Kiểm tra database connection trong console

2. **Frontend**:
   - Mở `http://localhost:5173`
   - Đăng ký tài khoản mới
   - Đăng nhập

3. **WebRTC**:
   - Tạo meeting mới
   - Mở tab incognito và join meeting
   - Kiểm tra video/audio connection

4. **RAG**:
   - Vào trang AI Chat
   - Upload file PDF
   - Hỏi câu hỏi về nội dung PDF

### Troubleshooting

#### Lỗi Database Connection
```bash
# Kiểm tra PostgreSQL đang chạy
# Windows
sc query postgresql

# Linux
sudo service postgresql status

# Kiểm tra credentials trong .env
```

#### Lỗi Ollama Connection
```bash
# Kiểm tra Ollama đang chạy
curl http://localhost:11434/api/tags

# Restart Ollama
ollama serve
```

#### Lỗi ChromaDB Connection
```bash
# Kiểm tra ChromaDB
curl http://localhost:8000/api/v1/heartbeat

# Restart ChromaDB
docker restart <container_id>
```

#### Lỗi WebRTC Connection
- Kiểm tra HTTPS (WebRTC yêu cầu HTTPS hoặc localhost)
- Kiểm tra firewall settings
- Cho phép camera/microphone permissions

---

## 📝 Ghi Chú

- **HTTPS**: Để sử dụng camera/microphone trên production, cần HTTPS
- **TURN Server**: Để WebRTC hoạt động qua NAT/Firewall, cần cấu hình TURN server
- **Ollama Models**: Models lớn (Llama3) cần RAM đủ lớn (>= 8GB)
- **ChromaDB**: Nên chạy ChromaDB trên server riêng cho production

---

## 🔗 Tài Liệu Tham Khảo

- [NestJS Documentation](https://docs.nestjs.com/)
- [React Documentation](https://react.dev/)
- [WebRTC Documentation](https://webrtc.org/)
- [LangChain Documentation](https://js.langchain.com/)
- [Ollama Documentation](https://ollama.ai/docs)
- [ChromaDB Documentation](https://docs.trychroma.com/)
- [TypeORM Documentation](https://typeorm.io/)
- [Redux Toolkit Documentation](https://redux-toolkit.js.org/)

---

**Phát triển bởi**: VoKhoi1305  
**Repository**: [Meeting_app](https://github.com/VoKhoi1305/Meeting_app)  
**License**: UNLICENSED (Private)
