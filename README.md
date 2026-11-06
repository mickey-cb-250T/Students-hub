# 🎓 Students Hub — Full-Stack Peer Study Platform

A modern, full-stack peer-to-peer study platform for college students. Students can share verified study notes, assignment walkthroughs, past year questions (PYQs), and campus announcements.

---

## ⚡ Tech Stack

- **Frontend**: React 18, TypeScript, Vite, Framer Motion, CSS3
- **Backend**: Node.js, Express, SQLite (`sqlite3` / `sqlite`), Multer, JWT, Bcrypt
- **Deployment Ready**: Express serves Vite production bundle, Docker support, Vercel config, Render/Railway ready

---

## 🚀 Quick Start (Local Development)

### 1. Install Dependencies
```bash
npm run install:all
```

### 2. Start Both Frontend & Backend
```bash
npm run dev
```

- **Frontend UI**: [http://localhost:5173](http://localhost:5173)
- **Backend API**: [http://localhost:5000/api](http://localhost:5000/api)
- **Health Check**: [http://localhost:5000/api/health](http://localhost:5000/api/health)

---

## 📦 How to Publish / Deploy

You can publish this project in two ways:

### Option A: All-in-One Deployment (Recommended: Render / Railway / Fly.io / VPS)

The Express backend is configured to automatically serve the built React frontend from a single port and domain.

1. **Build the frontend**:
   ```bash
   npm run build
   ```
2. **Start the production server**:
   ```bash
   npm start
   ```
3. Visit [http://localhost:5000](http://localhost:5000). Both UI and API run on port 5000 with zero CORS configuration required.

#### Deploying on Render (Free Web Service):
1. Push this project to GitHub.
2. In [Render Dashboard](https://dashboard.render.com), create a **New Web Service** and connect your repository.
3. Set the following settings:
   - **Build Command**: `npm run install:all && npm run build`
   - **Start Command**: `npm start`
   - **Environment Variables**:
     - `PORT`: `5000`
     - `JWT_SECRET`: *(A long random secret string)*

---

### Option B: Separate Frontend (Vercel) + Backend (Render / Railway)

#### Step 1: Deploy Backend (Render / Railway)
1. Set the root directory on the service to `students-hub-backend`.
2. **Build Command**: `npm install`
3. **Start Command**: `npm start`
4. Copy your live backend URL (e.g. `https://students-hub-backend.onrender.com`).

#### Step 2: Deploy Frontend (Vercel)
1. In Vercel, import your GitHub repo and select the `students-hub-frontend` folder as the root directory.
2. Add an Environment Variable:
   - `VITE_API_URL`: `https://students-hub-backend.onrender.com/api`
3. Deploy! The included `vercel.json` ensures client-side routing works on refresh.

---

### Option C: Docker Container Deployment

A production-ready multi-stage `Dockerfile` is included:

```bash
# Build the container
docker build -t students-hub .

# Run the container
docker run -p 5000:5000 -e JWT_SECRET=your_jwt_secret students-hub
```

---

## 🔑 Environment Variables

### Backend (`students-hub-backend/.env`)
| Variable | Default | Description |
| :--- | :--- | :--- |
| `PORT` | `5000` | Port for Express server |
| `JWT_SECRET` | *(string)* | Secret key for signing user authentication tokens |

### Frontend (`students-hub-frontend/.env`)
| Variable | Default | Description |
| :--- | :--- | :--- |
| `VITE_API_URL` | `/api` | Base URL of backend API (leave blank for unified deployment) |

---

## 🐙 Push to GitHub

To publish this project to GitHub:

```bash
git init
git add .
git commit -m "Initial commit: Students Hub full-stack platform"
git branch -M main
git remote add origin https://github.com/<your-username>/<your-repo-name>.git
git push -u origin main
```

