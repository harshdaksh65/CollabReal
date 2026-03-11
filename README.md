# CollabReal

A real-time collaborative document editor built with the MERN stack and Socket.IO. Multiple users can edit documents simultaneously with live syncing, cursor tracking, and version history.

## Features

- JWT authentication (register / login)
- Create, edit, and delete documents
- Real-time collaborative editing via Socket.IO
- Live cursor tracking & active-user presence
- Invite collaborators by email
- Version history with restore

## Tech Stack

**Frontend:** React, Vite, Tailwind CSS, Axios, Socket.IO Client  
**Backend:** Node.js, Express, Mongoose, Socket.IO, JWT, bcryptjs  
**Database:** MongoDB

## Getting Started

### Prerequisites

- Node.js ≥ 18
- MongoDB (local or Atlas)

### Backend

```bash
cd Backend
npm install
```

Create `Backend/.env`:

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/collabreal
JWT_SECRET=your_secret_key
```

```bash
npm start
```

### Frontend

```bash
cd Frontend
npm install
npm run dev
```

Backend runs on `http://localhost:5000`, frontend on `http://localhost:3000`.

## API Endpoints

All `/api/documents` routes require `Authorization: Bearer <token>`.

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register (`{ username, email, password }`) |
| POST | `/api/auth/login` | Login (`{ email, password }`) |
| GET | `/api/auth/me` | Current user |
| POST | `/api/documents` | Create document |
| GET | `/api/documents` | List documents |
| GET | `/api/documents/:id` | Get document |
| PUT | `/api/documents/:id` | Update document |
| DELETE | `/api/documents/:id` | Delete document (owner only) |
| POST | `/api/documents/:id/collaborators` | Add collaborator by email |
| DELETE | `/api/documents/:id/collaborators/:userId` | Remove collaborator |
| GET | `/api/documents/:id/versions` | Version history |

## Socket.IO Events

| Direction | Event | Description |
|-----------|-------|-------------|
| Client → Server | `join-document` | Join editing room |
| Client → Server | `send-changes` | Broadcast content changes |
| Client → Server | `cursor-update` | Share cursor position |
| Client → Server | `save-document` | Save & create version |
| Client → Server | `update-title` | Update document title |
| Server → Client | `load-document` | Initial document content |
| Server → Client | `receive-changes` | Content from other users |
| Server → Client | `active-users` | List of online editors |
| Server → Client | `user-joined` / `user-left` | Presence notifications |
| Server → Client | `document-saved` | Save confirmation |
| Server → Client | `title-updated` | Title change broadcast |

## Project Structure

```
Backend/   → Express API + Socket.IO server
Frontend/  → React SPA (Vite + Tailwind CSS)
```

