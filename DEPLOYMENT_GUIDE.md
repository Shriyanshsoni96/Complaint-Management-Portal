# Deployment Guide

**Project:** Complaint Management Portal (CMP)
**Target stack:** MongoDB Atlas (database) + Render (backend) + Vercel (frontend), per `docs/Project documntation phase by phase.md`.

> This guide documents **how** to deploy. No actual deployment has been performed as part of producing this document — it requires external accounts (MongoDB Atlas, Render, Vercel) that only you can create and authorize. Follow it step by step when you're ready to actually deploy (Milestone 13).

---

## 1. MongoDB Atlas

### 1.1 Create a cluster

1. Sign up / log in at [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas).
2. Create a new **Project** (e.g. "Complaint Management Portal").
3. Create a new **Cluster** — the free **M0** tier is sufficient for a class project.
4. Choose a cloud provider/region close to where your Render backend will run (reduces latency between them).

### 1.2 Create a database user

1. In the Atlas project, go to **Database Access** → **Add New Database User**.
2. Choose **Password** authentication, set a username and a strong generated password (save it — you'll need it in the connection string).
3. Grant it **Read and write to any database** (or scope it to just the CMP database if you prefer tighter permissions).

### 1.3 Network access

1. Go to **Network Access** → **Add IP Address**.
2. For a class project deployed on Render (which uses dynamic outbound IPs on shared plans), the simplest reliable option is **Allow Access from Anywhere** (`0.0.0.0/0`) — acceptable given the database user's password is strong and the cluster requires authentication regardless.
3. If you have Render's static outbound IP add-on or a fixed IP range, whitelist that instead for tighter security.

### 1.4 Get the connection string

1. Go to **Database** → **Connect** → **Drivers**.
2. Copy the provided SRV connection string, which looks like:
   ```
   mongodb+srv://<username>:<password>@<cluster-name>.mongodb.net/?retryWrites=true&w=majority
   ```
3. Add your database name to the path (the app expects one, e.g. `complaint_management_system`):
   ```
   mongodb+srv://<username>:<password>@<cluster-name>.mongodb.net/complaint_management_system?retryWrites=true&w=majority
   ```
4. **This is the value for the `MONGO_URI` environment variable** on the backend.

> The database and its collections do **not** need to be created manually — Mongoose creates them automatically the first time a document is written, and creates the indexes defined in each model (`server/src/models/*.js`) on connection. The only manual step is creating the first Admin account — see `SEEDING_GUIDE.md`.

### 1.5 Environment variables produced by this step

| Variable | Value |
|---|---|
| `MONGO_URI` | The full SRV connection string from step 1.4 |

---

## 2. Backend Deployment (Render)

### 2.1 Create the service

1. Push the repository to GitHub (or connect your existing remote) if you haven't already.
2. In Render, create a **New Web Service**, connect your repository.
3. Set the **Root Directory** to `server` (the backend is a subfolder of the monorepo, not the repo root).

### 2.2 Build command

```
npm install
```

There is no compile/build step for the backend — it's plain Node.js with ESM (`"type": "module"` in `server/package.json`), no TypeScript, no bundler.

### 2.3 Start command

```
npm start
```

Which runs `node src/server.js` (see `server/package.json`). Do **not** use `npm run dev` in production — that runs `nodemon`, which is meant for local file-watching only and is an unnecessary dependency to run in production.

### 2.4 Environment variables

Set these in Render's **Environment** tab (never commit real values to `server/.env` in git — it's already gitignored):

| Variable | Value |
|---|---|
| `NODE_ENV` | `production` |
| `PORT` | Leave unset — Render injects its own `PORT`, and `server/src/config/env.js` already reads `process.env.PORT` with a sensible fallback, so no hardcoding is needed |
| `MONGO_URI` | The Atlas connection string from §1.4 |
| `JWT_SECRET` | A freshly generated, long random string — **do not reuse the development secret** |
| `JWT_EXPIRES_IN` | `7d` (or your preferred token lifetime) |
| `CLIENT_URL` | Your deployed Vercel frontend URL (set this **after** deploying the frontend in §3, then redeploy the backend once you know the final URL) |

### 2.5 Health check

Render can be configured with a health check path. Use:

```
GET /api/v1/health
```

This route (`server/src/routes/health.routes.js`) responds with `200 OK` and a simple JSON payload as soon as the Express app is up — it does not depend on the database connection succeeding, since `app.js` never calls `connectDB()` itself (only `server.js` does, before the HTTP server starts listening). In practice this means: if the health check responds at all, the process is alive; if the process fails to boot because MongoDB is unreachable, Render will see the deploy fail to come up in the first place (per §7's "what happens if the database is unavailable" behavior — the server logs a clear `MongooseServerSelectionError` and exits).

### 2.6 Logs

Render's **Logs** tab streams stdout/stderr in real time. Look for:
- `MongoDB connected` — confirms the database connection succeeded.
- `Server running on port <port> in production mode` — confirms the HTTP server is listening.
- Any `Failed to start server: ...` line — indicates the database connection failed; double-check `MONGO_URI` and Atlas Network Access settings.

### 2.7 Common issues

| Symptom | Likely cause | Fix |
|---|---|---|
| Deploy succeeds but every request 500s | `JWT_SECRET` not set, or `MONGO_URI` malformed | Check environment variables tab for typos/missing values |
| `MongooseServerSelectionError: connect ETIMEDOUT` | Atlas Network Access doesn't allow Render's IP | Add `0.0.0.0/0` (or Render's static IP if using that add-on) in Atlas Network Access |
| CORS errors in the browser console | `CLIENT_URL` doesn't exactly match the deployed frontend origin | Update `CLIENT_URL` to match exactly (protocol + host, no trailing slash), then redeploy |
| Uploaded complaint images disappear after a while | Render's filesystem is ephemeral (see §6) | Expected on Render's free/standard tiers — plan for persistent storage if this matters long-term |

---

## 3. Frontend Deployment (Vercel)

### 3.1 Create the project

1. In Vercel, **Add New Project**, import the same GitHub repository.
2. Set the **Root Directory** to `client`.
3. Vercel auto-detects the Vite framework preset; confirm the settings match §3.2/§3.3 below.

### 3.2 Build command

```
npm run build
```

### 3.3 Output directory

```
dist
```

(Vite's default build output — already what `client/vite.config.js` produces, no custom `build.outDir` override exists.)

### 3.4 Environment variables

Set these in Vercel's **Project Settings → Environment Variables** — **critically, these are compile-time values** (Vite inlines `import.meta.env.*` into the built JS at build time), so they must be set **before** the build runs, and any change requires a new deployment/rebuild to take effect:

| Variable | Value |
|---|---|
| `VITE_API_URL` | Your deployed Render backend URL + `/api/v1`, e.g. `https://cmp-api.onrender.com/api/v1` |
| `VITE_SOCKET_URL` | Your deployed Render backend URL, no path, e.g. `https://cmp-api.onrender.com` |

### 3.5 Domain configuration

- Vercel provides a default `<project-name>.vercel.app` domain automatically — sufficient for a class project/demo.
- To use a custom domain, add it under **Project Settings → Domains** and follow Vercel's DNS instructions (CNAME/A record with your domain registrar). Not required for a typical class submission.
- Whatever the final domain is, it must be set as the backend's `CLIENT_URL` (§2.4) for CORS and Socket.IO to accept requests from it.

---

## 4. CORS

The backend's CORS configuration (`server/src/app.js`) is:

```js
app.use(cors({ origin: env.clientUrl, credentials: true }));
```

This accepts requests from **exactly one origin** — whatever `CLIENT_URL` is set to.

### Local development

`CLIENT_URL=http://localhost:5173` (Vite's default dev server port) — already the default in `server/.env.example`.

### Production

`CLIENT_URL=https://<your-vercel-domain>` — must be the **exact** origin (correct protocol, correct host, no trailing slash, no path). A mismatch (e.g. `http://` instead of `https://`, or a trailing `/`) will cause every cross-origin request to be silently blocked by the browser with a CORS error.

### Multiple origins

The current implementation supports only a single string origin. If you need to allow more than one simultaneously (for example, a production domain **and** Vercel's automatically-generated preview-deployment URLs, which each get a unique subdomain), the `cors()` origin option would need to become a function or an array, e.g.:

```js
const allowedOrigins = [env.clientUrl, 'https://cmp-preview-*.vercel.app'];
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.some((allowed) => matches(allowed, origin))) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));
```

**This change has not been made** — it's a real architectural decision (do you need multi-origin support at all for your submission?) that should be made deliberately, not implemented speculatively. Flagged here for your decision.

---

## 5. Socket.IO

### Production configuration

Socket.IO is created directly on the same HTTP server as Express (`server/src/server.js`):

```js
const io = new Server(httpServer, {
  cors: { origin: env.clientUrl, credentials: true },
});
```

It shares the exact same `CLIENT_URL` environment variable as Express's CORS config — there is nothing extra to configure for Socket.IO specifically once `CLIENT_URL` is set correctly for the HTTP API. No separate port, no separate service, no separate deployment step.

### Common issues

| Symptom | Likely cause | Fix |
|---|---|---|
| Socket connects locally but not in production | `VITE_SOCKET_URL` still pointing at `localhost` in the Vercel build | Set `VITE_SOCKET_URL` in Vercel's environment variables and rebuild |
| `connect_error` immediately after connecting in production | `CLIENT_URL` mismatch (same root cause as CORS issues) | Fix `CLIENT_URL` on the backend to exactly match the deployed frontend origin |
| Socket connects but disconnects repeatedly | Hosting platform's proxy/load balancer doesn't support WebSocket upgrades, or an aggressive idle timeout | Confirm your host supports WebSockets (Render does by default); Socket.IO automatically falls back to HTTP long-polling if WebSocket upgrade fails, so total failure is more likely a CORS/auth issue than a transport issue |

### Debugging

1. Browser DevTools → Network tab → filter by "WS" — confirm a websocket connection (or a `polling` fallback) is actually established to the right host.
2. Check the backend logs for `Socket connected: <id> (user <userId>)` — if this never appears, the handshake auth middleware (`server/src/sockets/index.js`) is rejecting the token before a room is even joined.
3. If connected but no events arrive, confirm the triggering action actually happened server-side (e.g. did the assignment API call actually succeed?) and that the listening client is in the correct room (each event only reaches specific rooms — see `ARCHITECTURE_GUIDE.md`'s Socket.IO Flow section for the full room/event map).

---

## 6. File Upload

### Current implementation

Complaint images are handled by Multer with **disk storage** (`server/src/middlewares/upload.middleware.js`), writing files to `server/src/uploads/complaints/` on whatever machine the Node process is running on, then served back via `express.static` at `/uploads/complaints/<filename>`.

### Ephemeral storage — the deployment-relevant caveat

**Render's filesystem (on its standard web service plans) is ephemeral**: any file written to disk is lost whenever the service restarts, redeploys, or scales. This means:
- Uploaded complaint images will **disappear** after any redeploy.
- This is very likely acceptable for a class project demo (redeploys are infrequent and controlled by you), but would be a real problem for any longer-lived or production use.

### Future cloud storage options (not implemented — a future improvement, not a current requirement)

If persistent uploads become necessary, the standard approach is to swap Multer's `diskStorage` for a cloud-backed storage engine, for example:
- **AWS S3** (or an S3-compatible service like Cloudflare R2/Backblaze B2) via `multer-s3`.
- **Cloudinary**, which has a dedicated Multer storage adapter (`multer-storage-cloudinary`) and handles image transformations for free.

Either option only requires changes inside `upload.middleware.js` (the storage engine) and `getAssetUrl.js` on the frontend (to build the new, cloud-hosted image URL) — the rest of the application (validation, complaint creation flow, static-serving route) would no longer be needed for the complaints route, but everything else is unaffected. **Not implemented as part of this phase** — flagged as an optional future improvement per your request, not undertaken without approval.

---

## 7. Deployment Readiness Summary

| Item | Status |
|---|---|
| Frontend build verified locally | ✅ `npm run build` succeeds |
| Backend verified locally (against a real, temporary database) | ✅ All 61 backend tests pass; 27 live API checks pass |
| MongoDB Atlas cluster | ⬜ Not yet created — follow §1 |
| Render backend service | ⬜ Not yet created — follow §2 |
| Vercel frontend project | ⬜ Not yet created — follow §3 |
| Production environment variables gathered | ⬜ Depends on §1–§3 being completed first |
| First Admin account plan | ✅ Documented in `SEEDING_GUIDE.md` — run `npm run seed:admin` against the production database once it's reachable |
| CORS multi-origin decision | ⬜ Needs your decision (§4) — single-origin works today |
| Persistent file storage decision | ⬜ Needs your decision (§6) — ephemeral storage works for a demo |

**The application code itself is deployment-ready** (verified working end-to-end against a real database in this session). What remains is entirely external account setup (Atlas/Render/Vercel) and the handful of decisions flagged above — none of which require further code changes to proceed with a basic deployment.
