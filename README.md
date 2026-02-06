# PulseStream

A full-stack video streaming and management application. Users can sign up, upload videos, and stream them with HTTP range-request support. Role-based access (viewer, editor, admin) and real-time processing status via Socket.IO are included.

---

## Table of Contents

1. [Installation and Setup](#installation-and-setup)
2. [Architecture Overview](#architecture-overview)
3. [API Documentation](#api-documentation)
4. [User Manual](#user-manual)
5. [Assumptions and Design Decisions](#assumptions-and-design-decisions)

---

## Installation and Setup

### Prerequisites

- **Node.js** (v18 or later recommended)
- **MongoDB** (local or Atlas)
- **FFmpeg** (for server-side video processing: duration, faststart, sensitivity)

### Backend (Server)

1. Navigate to the server directory:
   ```bash
   cd Server
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in `Server/` with:
   ```env
   PORT=3000
   MONGO_URI=mongodb://localhost:27017/pulsestream
   JWT_SECRET=your-secret-key
   JWT_EXPIRES_IN=7d
   FRONTEND_URL=http://localhost:5173
   UPLOAD_DIR=./uploads/videos
   VIDEO_MAX_SIZE=524288000
   ```
   - `VIDEO_MAX_SIZE` is in bytes (default 500MB).
4. Start the server:
   ```bash
   npm run dev
   ```
   (Uses nodemon. For production: `npm start`.)

### Frontend (Client)

1. Navigate to the client directory:
   ```bash
   cd Client
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in `Client/` with:
   ```env
   VITE_SERVER_URL=http://localhost:3000
   ```
   (No trailing slash. Replace with your backend URL if different.)
4. Start the dev server:
   ```bash
   npm run dev
   ```
   The app is typically at `http://localhost:5173`.

### FFmpeg

- **Windows:** Install FFmpeg and add it to `PATH`.
- **macOS:** `brew install ffmpeg`
- **Linux:** `apt install ffmpeg` or equivalent.

The server uses FFmpeg to get video duration, apply faststart for streaming, and (via the sensitivity analyzer) derive metadata used for the “safe” / “flagged” classification.

---

## Architecture Overview

### High-Level

```
┌─────────────────┐         ┌─────────────────┐         ┌─────────────────┐
│   React (Vite)  │  HTTP   │  Express (Node)  │  TCP    │     MongoDB     │
│   Client        │ ──────► │   Server        │ ──────► │   + uploads     │
│   Socket.IO     │ ◄────── │   Socket.IO     │         │   (file store)   │
└─────────────────┘  WS     └─────────────────┘         └─────────────────┘
                                    │
                                    ▼
                            FFmpeg (video processing)
```

- **Client:** React 19, Vite, React Router. Auth via React Context; API calls and Socket.IO for real-time progress.
- **Server:** Express, JWT auth, RBAC (viewer/editor/admin), Multer for uploads, streaming service with Range support, background video processing (FFmpeg), Socket.IO for progress events.

### Backend Structure

| Path | Purpose |
|------|--------|
| `server.js` | HTTP + Socket.IO server, CORS, auth middleware for sockets |
| `config/db.js` | MongoDB connection |
| `routes/` | Auth, videos, admin API routes |
| `controllers/` | Auth, video, admin request handlers |
| `models/` | User, Video (Mongoose) |
| `middleware/` | JWT auth, RBAC (requireRole) |
| `services/videoUploadService.js` | Multer config (disk storage, size limit, MIME filter) |
| `services/streamingService.js` | Video streaming with HTTP Range (206), HEAD support |
| `services/videoProcessingService.js` | FFmpeg pipeline: duration → faststart → sensitivity → status updates |
| `utils/` | Access helpers, sensitivity analyzer (metadata-based) |

### Frontend Structure

| Path | Purpose |
|------|--------|
| `src/App.jsx` | Routes, ProtectedRoute, PublicOnlyRoute |
| `src/main.jsx` | Root render, AuthProvider |
| `src/context/` | Auth context (createContext, Provider, useAuth) |
| `src/api/` | REST client, auth, videos, admin, socket |
| `src/pages/` | Login, Signup, Dashboard, Upload, Library, VideoDetail, Admin |
| `src/components/` | Layout, modals, VideoCard, VideoStatusPill, etc. |
| `src/utils/` | Formatters (duration, date, etc.), toast |

### Data and Auth Flow

- **Auth:** Register/Login return JWT and user payload. Client stores only the **token** (e.g. in `localStorage`). User details are loaded via `GET /api/auth/me` when the app loads or after login.
- **Videos:** Stored in MongoDB (metadata) and on disk (`uploads/videos/`). Streaming uses the same file path with `fs.createReadStream` and Range handling.
- **Real-time:** After upload, the server runs video processing in the background and emits `video:progress` (Socket.IO) to the room `user:{ownerId}`. Client subscribes to update UI (e.g. Library, Dashboard, Upload).

---

## API Documentation

Base URL: `/api` (e.g. `http://localhost:3000/api`).

All authenticated endpoints expect:
- **Header:** `Authorization: Bearer <token>`, or
- **Query:** `?token=<token>` (used for streaming URL, since `<video src>` cannot send headers).

Responses use a common shape: `{ success: true | false, message?: string, ...data }`.

---

### Auth (`/api/auth`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/auth/register` | No | Register. Body: `name`, `email`, `password`, optional `role` (viewer \| editor \| admin). |
| POST | `/auth/login` | No | Login. Body: `email`, `password`. Returns `token` and `user`. |
| GET | `/auth/me` | Yes | Current user (no password). Used to hydrate user from token. |

---

### Videos (`/api/videos`)

| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| GET | `/videos` | Yes | viewer, editor, admin | List current user’s videos. Query: `status`, `sensitivity`. |
| GET | `/videos/:id` | Yes | viewer, editor, admin | Get one video metadata (no file path). |
| GET | `/videos/:id/stream` | Yes | viewer, editor, admin | Stream video (Range requests supported). Use `?token=` for `<video src>`. |
| POST | `/videos/upload` | Yes | editor, admin | Upload video. `multipart/form-data`: `title`, `video` (file). Max size and MIME enforced. |
| PATCH | `/videos/:id` | Yes | editor, admin | Update metadata. Body: `title`. |
| DELETE | `/videos/:id` | Yes | editor, admin | Delete video and file. |

**Streaming (GET `/videos/:id/stream`):**

- Supports **Range** header (e.g. `bytes=0-1048575`).
- Returns **206 Partial Content** with `Content-Range` and streamed body.
- **HEAD** returns 200 with `Accept-Ranges: bytes` and `Content-Length` (no body).
- Only videos with `status === "completed"` are streamable.

---

### Admin (`/api/admin`)

All admin routes require **admin** role.

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/admin/stats` | Dashboard stats (e.g. counts). |
| GET | `/admin/users` | List users (with video counts, no password). |
| POST | `/admin/users` | Add user. Body: `name`, `email`, `password`, optional `role`. |
| PATCH | `/admin/users/:id` | Update user. Body: `name`, `role`. |
| DELETE | `/admin/users/:id` | Delete user. |

---

### Socket.IO (real-time)

- **URL:** Same origin as API (e.g. `http://localhost:3000`).
- **Auth:** Pass token in `auth.token` or `query.token` on connect.
- **Room:** Each user is joined to `user:{userId}`.
- **Event:** `video:progress` — payload includes `videoId`, `status`, `progress`, `sensitivity`, `duration`, `error` (on failure). Client uses this to update Library, Dashboard, and Upload progress.

---

## User Manual

### Roles

- **Viewer:** Can sign in, view Dashboard, Library, and stream completed videos. Cannot upload, edit, or delete.
- **Editor:** Viewer + upload, edit title, delete own videos.
- **Admin:** Editor + access Admin panel: manage users (add, edit, delete) and view stats.

### Main Flows

1. **Sign up / Sign in**  
   Use Login or Signup. After login you are redirected to the Dashboard.

2. **Dashboard**  
   Overview: total/safe/flagged/processing counts and recent activity. Status updates in real time via Socket.IO.

3. **Upload**  
   (Editors and admins.) Enter title, choose file (allowed types and size limit apply). After upload, processing runs in the background; progress is shown and you are notified when complete or failed.

4. **Library**  
   List of your videos with status (Safe, Flagged, Processing, Failed). Click a video to open its detail page. Editors/admins can delete from the card or from the detail page.

5. **Video detail & playback**  
   View metadata and play the video. Playback uses HTTP range requests (streaming). Download uses the same stream URL with a suggested filename.

6. **Admin panel**  
   (Admins only.) View stats, list users, add user, edit user (name/role), delete user.

---

## Assumptions and Design Decisions

### Authentication and Security

- **JWT in localStorage:** The client stores only the JWT for persistence. User object is not stored; it is fetched from `GET /api/auth/me` when the app loads or after login. This avoids storing user details in localStorage.
- **Token in stream URL:** The `<video>` element cannot send custom headers. To keep streaming authenticated, the stream URL includes `?token=`. The backend auth middleware accepts `req.query.token`. For production, short-lived signed URLs could replace the long-lived JWT in the URL.
- **RBAC:** Roles (viewer, editor, admin) are enforced in middleware; sensitive routes (upload, delete, admin) require the appropriate role.

### Video Upload and Storage

- **Multer disk storage:** Files are streamed to disk (no full-file buffer in memory). Limits (file size, MIME types) and UUID filenames reduce abuse and collisions.
- **Processing pipeline:** After upload, processing runs asynchronously (duration via FFprobe, optional faststart, sensitivity from metadata). Status is emitted over Socket.IO so the UI updates in real time.

### Streaming

- **HTTP Range requests:** The streaming service supports `Range` for seeking and efficient loading. It validates and clamps ranges, returns 206 with `Content-Range`, and destroys the read stream on client disconnect to avoid leaks. HEAD is supported for discovery.
- **Direct stream URL:** The client uses a direct URL to `/videos/:id/stream?token=...` as `<video src>`, so the browser issues Range requests itself. No full-file download in the client before playback.

### Frontend

- **React Context for auth:** A single auth context provides user, token, login, logout, and loading state. Protected and public-only routes use this context.
- **Reusable components:** Shared components (e.g. VideoStatusPill, VideoCard, ConfirmDeleteModal, UserModal) keep the UI consistent and reduce duplication across Dashboard, Library, Admin, and VideoDetail.
- **Socket.IO for progress:** One Socket connection is shared; clients subscribe to `video:progress` and update local state so Library, Dashboard, and Upload reflect processing status without polling.

### Assumptions

- MongoDB is the only database; file storage is local disk (`uploads/videos/`). For scale, you might use object storage (e.g. S3) and a job queue for processing.
- Sensitivity is derived from metadata (e.g. duration, size) in a simple analyzer, not ML-based content moderation.
- One server process handles HTTP and Socket.IO; upload and processing are in-process. For high concurrency, upload/processing could be offloaded to workers or external services.
- The app is intended for a single organization or course use; multi-tenancy and advanced permissions are not implemented.
