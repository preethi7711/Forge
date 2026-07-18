# Forge — Identity-Driven Productivity & Discipline Social Platform

Forge is a high-fidelity, production-ready, full-stack **identity-driven productivity platform** built using the **MERN stack** (MongoDB/Mongoose-compatible API, Express, React, and Node) with **Socket.io** for real-time multiplayer discipline synchronization. 

Instead of generic social networks designed around engagement loops like endless scrolling and likes, Forge rewards **consistency, personal promises, accountability, and real-world discipline**.

---

## 🌌 System Architecture & Request Flow

Forge operates as a highly integrated full-stack application.

```
       [ Client-Side React SPA ] 
         /                   \
(HTTPS API Requests)     (Socket.io WebSockets)
       /                       \
      v                         v
[ Express.js REST API ] <---> [ Socket.io Web-Server ] (on Port 3000)
      |
[ High-Fidelity DB Manager ] (Mongoose-Ready fallback to Local JSON)
```

---

## 📂 Production Folder & File Structure

```
├── /server.ts              # Full-stack entry point (Express, Sockets, Vite SPA serving)
├── /server                 # Backend MVC Directory
│   ├── db.ts               # Database abstraction layer (Portable fallback persistence)
│   ├── socket.ts           # Socket.io real-time connection & broadcast manager
│   └── routes.ts           # REST API routes (Auth, Habits, Challenges, Circles, Social)
├── /src                    # Frontend Client Directory
│   ├── main.tsx            # React application mounting point
│   ├── App.tsx             # Master React controller & Socket listener
│   ├── types.ts            # Client TypeScript interfaces
│   ├── index.css           # Global Tailwind directives & loaded typography
│   └── /components         # Modular Front-end View Controllers
│       ├── Auth.tsx        # Sign In / Sign Up glassmorphic screen
│       ├── Dashboard.tsx   # Heatmaps, checklists, streak metrics, level progress
│       ├── HabitsManager.tsx# Arsenal builder & custom habit drawer
│       ├── Challenges.tsx  # Epic multi-day challenge quests
│       ├── Circles.tsx     # Accountability rooms & live socket chats
│       ├── Feed.tsx        # Progress stream, comment drawers, cheers
│       ├── Leaderboard.tsx # Vanguard rank boards & profile finders
│       └── LucideIcon.tsx  # Typo-safe Lucide vector icon manager
├── package.json            # Deployment dependencies & NPM scripts
└── tsconfig.json           # TypeScript compilation config
```

---

## 🛠️ REST API Specification

All REST API endpoints are prefixed with `/api`. Authenticated requests require the `Authorization: Bearer <JWT_TOKEN>` header.

### 🔐 Authentication

#### 1. Register User
- **Method**: `POST`
- **Endpoint**: `/api/auth/register`
- **Payload**:
  ```json
  { "username": "alpha_dev", "email": "alpha@example.com", "password": "securepassword123" }
  ```
- **Response (201)**:
  ```json
  {
    "token": "JWT_HEADER.PAYLOAD.SIGNATURE",
    "user": { "id": "9x2j3s1a", "username": "alpha_dev", "level": 1, "xp": 50, "streak": 0, "recoveryTokens": 1 }
  }
  ```

#### 2. Login User
- **Method**: `POST`
- **Endpoint**: `/api/auth/login`
- **Payload**:
  ```json
  { "username": "alpha_dev", "password": "securepassword123" }
  ```
- **Response (200)**: Auth token and detailed profile stats.

---

### 📅 Habits

#### 1. Create Habit
- **Method**: `POST`
- **Endpoint**: `/api/habits`
- **Payload**:
  ```json
  {
    "name": "Write Rust Code",
    "category": "coding",
    "difficulty": "hard",
    "target": "60 mins",
    "frequency": "daily",
    "notes": "Solve 1 Leetcode medium",
    "color": "bg-indigo-600",
    "icon": "Code"
  }
  ```

#### 2. Check-in/Toggle Habit
- **Method**: `POST`
- **Endpoint**: `/api/habits/:id/checkin`
- **Payload**: `{ "date": "2026-07-16" }` (Defaults to today's local date if empty).
- **Response (200)**: Returns the updated habit, XP awarded, and level-up statuses.

---

## ⚡ Real-Time WebSockets (`Socket.io`)

Forge uses WebSockets to build a living accountability environment:
1. **`register` (Client -> Server)**: Associates the connection socket with the authenticated user ID.
2. **`notification` (Server -> Client)**: Instantly pushes visual banner toasts on social interactions.
3. **`circle-message` (Server <-> Client)**: Transmits messages instantly inside accountability chatrooms.
4. **`celebration-broadcast` (Server -> All Clients)**: Broadcasts congratulations to all active users when a teammate levels up or completes a hard challenge.

---

## 🧠 Core System Algorithmic Engine

### 1. The Streak Engine
Streaks are calculated chronologically. Let $C$ be the sorted set of unique dates a habit was checked off.
- **Is Alive**: The streak remains active if today ($T$) or yesterday ($Y$) belongs to $C$.
- **Calculation**: We start checking from $T$ (or $Y$ if $T \notin C$), checking backwards day-by-day. While $check\_date \in C$, $streak = streak + 1$.
- **Recovery Token Safe-net**: If a user misses a daily check-in and their overall streak is broken, the engine automatically consumes a **Recovery Token** if $tokens > 0$. The streak is preserved, and a warning system log is posted.

### 2. Gamified Discipline & Consistency
- **Discipline Score (7 Days)**:
  $$\text{Discipline Score} = \left( \frac{\text{Actual Completions in Last 7 Days}}{\text{Total Habit Instances in Last 7 Days}} \right) \times 100$$
- **Consistency Score (30 Days)**: Displays overall commitment density based on completed instances over a rolling 30-day window.

---

## 📚 Technical Mentor Guides & Interview Prep

### Why use custom WebSockets instead of polling?
Frequent AJAX HTTP polling creates a high overhead due to TCP connection creations and header redundancies. WebSockets establish a single persistent duplex connection over TCP, reducing network overhead, reducing backend CPU load, and enabling real-time peer-to-peer updates.

### How is password security guaranteed?
Forge uses `bcryptjs` for security. Bcrypt utilizes a custom key derivation function incorporating a cryptographic "salt" and an adjustable "work factor" (cost). This makes it highly resistant to rainbow-table and high-speed hardware brute-force attacks.

---

## 🚀 Installation & Local Execution

### Prerequisites
- Node.js (v18+)
- NPM or Yarn

### Steps
1. **Clone & Install Dependencies**:
   ```bash
   npm install
   ```
2. **Setup Local Environment**:
   Define `JWT_SECRET` in `.env`.
3. **Run in Development**:
   ```bash
   npm run dev
   ```
4. **Compile Production Bundle**:
   ```bash
   npm run build
   ```
5. **Start Production Host**:
   ```bash
   npm run start
   ```
