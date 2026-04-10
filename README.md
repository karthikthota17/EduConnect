# 🎓 EduConnect Platform

A comprehensive, real-time EduConnect solution designed for seamless teacher-student interaction. This platform features live classes with WebRTC video, real-time attendance via QR codes, an interactive quiz system, automated analytics, and a robust notification engine.

---

## 🛠 Technology Stack

- **Frontend**: React.js (Vite), Redux Toolkit, Socket.io-client, Tailwind CSS, Framer Motion, HTML5-QRCode.
- **Backend**: Node.js, Express.js, MongoDB (Mongoose), Socket.io, JWT.
- **Real-time**: WebRTC for video/audio, Socket.io for signals and state sync.
- **Visuals**: Three.js for interactive 3D backgrounds.

---

## 📂 Project Structure Explained

### 📁 Backend (`/backend`)
The backend is a RESTful API and WebSocket server built with Express.

#### 📍 Core Files
- `server.js`: The central entry point. Initializes the Express app, MongoDB connection, and Socket.io server.
- `.env`: Environment variables (Port, MongoDB URI, JWT Secret ).

#### 📁 Controllers (`/controllers`)
Handles the business logic for various entities:
- `adminController.js`: Management tasks for the portal administrators.
- `authController.js`: Handles user registration, login, and profile management.
- `classController.js`: Manages classroom lifecycle, enrollment, and attendance tracking.
- `classworkController.js`: Handles creation and management of materials, assignments, and quizzes.
- `notificationController.js`: Manages real-time and persistent system notifications.

#### 📁 Models (`/models`)
Defines the structure of MongoDB documents using Mongoose schemas:
- `User.js`, `Class.js`, `Enrollment.js`: Core entities for users and class memberships.
- `Attendance.js`: Records for QR-based attendance sessions.
- `Material.js`, `Assignment.js`, `Submission.js`: Documents for classwork and student work.
- `Quiz.js`, `QuizResponse.js`: Schema for the dynamic quiz engine.
- `Announcement.js`, `Notification.js`: Models for communication.

#### 📁 Sockets (`/sockets`)
- `signaling.js`: The heart of real-time communication. Manages WebRTC handshakes for live video calls and broadcasts teacher/room status updates.

#### 📁 Others
- `routes/`: Express routers that map HTTP endpoints to controllers.
- `middlewares/authMiddleware.js`: Protects routes by validating JWT tokens.
- `utils/upload.js`: Configures Multer for handling file uploads (documents, materials).

---

### 📁 Frontend (`/frontend`)
A modern, responsive SPA built with React.

#### 📍 Core Files
- `App.jsx`: Main routing configuration for the application.
- `main.jsx`: Application bootstrap and Redux store provider.
- `index.css`: Global styles including the premium design system and animations.

#### 📁 Components (`/src/components`)
- `Background3D.jsx`: Interactive Three.js background for a premium user experience.
- `ClassCard.jsx`: Reusable card for classroom summaries.
- `CreateClassworkModals.jsx`: Unified interface for teachers to create assignments, quizzes, and materials.
- `SmartScanner.jsx`: Advanced QR scanner for student joining and attendance.

#### 📁 Pages (`/src/pages`)
- `Dashboard.jsx`: Role-based main view for students and teachers.
- `ClassDetails.jsx`: The "Stream" and navigation hub for a specific class.
- `LiveClass.jsx`: The WebRTC live classroom interface with video, chat, and screen sharing.
- `QuizBuilder.jsx` & `TakeQuiz.jsx`: Full-cycle quiz management system.
- `Analytics.jsx`: Data visualization for student performance and attendance.

#### 📁 State & Context (`/src/store` & `/src/context`)
- `store.js`: Central Redux store.
- `authSlice.js`, `classSlice.js`, `classworkSlice.js`: Logic for local state management and API integration.
- `SocketContext.jsx`: Provides a global, persistent websocket connection throughout the app.

---

## 🚀 Key Features

1.  **Live Video Classroom**: Peer-to-peer video/audio with screen sharing and real-time chat.
2.  **Smart Attendance**: Teachers generate unique QR codes for attendance sessions; students scan to mark presence securely.
3.  **Dynamic Quizzes**: Real-time quiz creation with instant feedback and grading.
4.  **Analytics Dashboard**: Visual representations of attendance trends and class performance.
5.  **Role-Based Access**: Explicitly separated workflows for students, teachers, and administrators.

---

## ⚙️ Installation

1.  **Backend**:
    ```bash
    cd backend
    npm install
    npm start
    ```
2.  **Frontend**:
    ```bash
    cd frontend
    npm install
    npm run dev
    ```

Ensure your `.env` files are configured according to the `.env.example` in each directory.
