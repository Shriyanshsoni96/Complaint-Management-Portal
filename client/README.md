# Complaint Management Portal — Client

React (Vite) frontend for the Complaint Management Portal. See the [root README](../README.md) for the full project overview, and [`docs/`](../docs/) for the complete requirements/architecture/API specification.

## Stack

React 19 + Vite 8, Tailwind CSS v4, React Router DOM 7, Axios, Context API (Auth/Socket/Theme/Toast), Chart.js + react-chartjs-2, Socket.IO Client. Tested with Vitest + React Testing Library + jsdom.

## Setup

```bash
npm install
cp .env.example .env   # then fill in real values
```

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the Vite dev server |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Preview the production build locally |
| `npm test` | Run the Vitest test suite |
| `npm run lint` | Run ESLint |
| `npm run format` | Format the codebase with Prettier |

## Environment Variables

| Variable | Purpose |
| --- | --- |
| `VITE_API_URL` | Base URL of the backend REST API (e.g. `http://localhost:5000/api/v1`) |
| `VITE_SOCKET_URL` | Base URL of the backend Socket.IO server (e.g. `http://localhost:5000`) |

## Structure

```
src/
├── components/   # Reusable UI building blocks (ui, cards, charts, tables, forms, notifications, common)
├── constants/    # Shared enums/keys
├── context/      # Auth, Socket, Theme, Toast providers
├── hooks/        # Shared React hooks
├── layouts/       # Per-role dashboard chrome (DashboardShell + role wrappers)
├── pages/        # Route-level screens, grouped by role
├── routes/       # Router table + auth guard
├── services/     # Axios wrappers, one per backend resource
├── socket/       # Socket.IO client singleton
├── styles/       # Tailwind entry + animations
└── utils/        # Small pure helpers
```
