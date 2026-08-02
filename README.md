# Complaint Management Portal

A centralized MERN-stack web application for registering, tracking, and resolving complaints. Citizens submit and track complaints, department officers manage assigned complaints, and administrators oversee users, departments, assignments, and analytics.

Full requirement, architecture, database, API, and roadmap documentation lives in [`docs/`](docs/).

## Tech Stack

| Layer | Technology |
| --- | --- |
| Frontend | React (Vite), Tailwind CSS, React Router DOM, Axios, Context API, Chart.js, Socket.IO Client |
| Backend | Node.js, Express.js, MongoDB, Mongoose, JWT, bcrypt, Express Validator, Multer, Socket.IO |
| Deployment | Vercel (client), Render (server), MongoDB Atlas (database) |

## Project Structure

```
Complaint-Management-Portal/
├── client/   # React + Vite frontend
├── server/   # Express + MongoDB backend
├── docs/     # Requirement, architecture, API, and roadmap documentation
└── README.md
```

## Prerequisites

- Node.js 20+
- A running MongoDB instance (local or MongoDB Atlas)

## Getting Started

Install dependencies for both apps:

```bash
npm run install:all
```

Copy the environment templates and fill in real values:

```bash
cp client/.env.example client/.env
cp server/.env.example server/.env
```

Run both client and server together in development mode:

```bash
npm run dev
```

Or run them individually:

```bash
npm run dev --prefix client   # http://localhost:5173
npm run dev --prefix server   # http://localhost:5000
```

## Environment Variables

**client/.env**

| Variable | Description |
| --- | --- |
| `VITE_API_URL` | Base URL of the backend REST API (e.g. `http://localhost:5000/api/v1`) |
| `VITE_SOCKET_URL` | Base URL of the backend Socket.IO server |

**server/.env**

| Variable | Description |
| --- | --- |
| `PORT` | Port the API server listens on |
| `NODE_ENV` | `development` or `production` |
| `MONGO_URI` | MongoDB connection string |
| `JWT_SECRET` | Secret used to sign JWTs |
| `JWT_EXPIRES_IN` | JWT expiry duration (e.g. `7d`) |
| `CLIENT_URL` | URL of the frontend, used for CORS |

## Development Workflow

This project is built one milestone at a time, following [`docs/Project documntation phase by phase.md`](docs/Project%20documntation%20phase%20by%20phase.md). See that document's Development Roadmap section for the full milestone list.

## API

All endpoints are served under `/api/v1`. Responses follow a consistent envelope:

```json
{ "success": true, "message": "", "data": {} }
```

```json
{ "success": false, "message": "", "errors": [] }
```
