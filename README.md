# Feature Flag Management System

A full-stack web application to create, manage and evaluate feature flags. It lets teams switch features on or off without redeploying code, keeps a complete audit trail of every change, and exposes a secure API so external client applications can check flag status using API keys.

## Features

- **User authentication:** signup and login with protected routes on the dashboard
- **Flag management:** create, view, update, toggle and delete feature flags
- **Flag check API:** client applications can check whether a flag is enabled
- **Client apps and API keys:** register client applications and authenticate their requests with an API key
- **Audit logs:** every change to a flag is recorded and can be viewed in the dashboard
- **Redis caching:** fast flag lookups for the check endpoint
- **Docker support:** Dockerfile included for the backend

## Tech Stack

- **Frontend:** React, Vite, Axios, React Router
- **Backend:** Node.js, Express
- **Cache:** Redis
- **Deployment:** Docker

## Project Structure

```
feature-flag-system/
├── client/                  # Frontend (React + Vite)
│   └── src/
│       ├── api/             # Axios configuration
│       ├── components/      # Reusable components (ProtectedRoute)
│       └── pages/           # Home, Login, Signup, Flags, AuditLogs
└── server/                  # Backend (Node.js + Express)
    ├── config/              # Redis and other configuration
    ├── middleware/          # API key middleware
    ├── routes/              # auth, flags, check, audit, client apps
    ├── Dockerfile
    └── server.js
```

## Getting Started

### Prerequisites

- Node.js (v18 or higher) and npm
- A running Redis instance
- The database used by the backend, running locally or hosted

### 1. Clone the repository

```bash
git clone https://github.com/Shreyasrivastava24/Feature-Flag-Management-System.git
cd Feature-Flag-Management-System
```

### 2. Run the backend

```bash
cd server
npm install
```

Create a `.env` file inside the `server` folder with the values your setup needs: the server port, the database connection string, the Redis connection URL and the secret used for authentication. Then start the server:

```bash
npm start
```

### 3. Run the frontend

Open a new terminal:

```bash
cd client
npm install
npm run dev
```

The app will open at `http://localhost:5173`. Make sure the API base URL in `client/src/api/axios.js` points to your running backend.

### Run the backend with Docker

```bash
cd server
docker build -t feature-flag-server .
docker run -p 5000:5000 --env-file .env feature-flag-server
```

## How It Works

1. A user signs up and logs in to the dashboard.
2. The user creates feature flags and toggles them on or off.
3. Every change is saved in the audit log with its details.
4. A client application registers, receives an API key and calls the check endpoint to find out if a flag is enabled. Results are served from the Redis cache for speed.

## Author

**Shreya Srivastava**
GitHub: [@Shreyasrivastava24](https://github.com/Shreyasrivastava24)