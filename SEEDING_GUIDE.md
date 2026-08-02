# Seeding Guide

This guide explains how to bootstrap a brand-new Complaint Management Portal database: creating the first Admin account, and optionally populating realistic demo data for local development or a classroom/teacher demonstration.

## Why this exists

By design (see `docs/Project documntation phase by phase.md`, Milestone 6), there is **no public API endpoint that creates an Admin or Officer account**. Self-registration (`POST /api/v1/auth/register`) always creates a `citizen`. Officers are created by an Admin promoting an existing registered user. This is correct and intentional for security (nobody should be able to register themselves as an Admin), but it means a **fresh, empty database has no way to create its first Admin through the API**. These two seeder scripts solve that.

Both seeders live in `server/src/seeders/` and connect to whatever database `MONGO_URI` (in `server/.env`) points at — the same connection logic (`connectDB()`) the real server uses. They are plain Node scripts, not part of the running application; run them once from the command line whenever you need them.

---

## 1. Creating the first Admin account

```bash
cd server
npm run seed:admin
```

This runs `server/src/seeders/adminSeeder.js`, which:

1. Connects to the database configured in `server/.env`.
2. Checks whether **any** Admin account already exists. If one does, it prints the existing admin's email and exits without creating anything — **safe to run multiple times**.
3. Otherwise, creates one Admin user. The password is hashed exactly the way every other user's password is (the `User` model's `pre('save')` hook, bcrypt with 10 salt rounds) — the seeder does not do any hashing itself, it just relies on the same model everything else uses.
4. Prints the created account's name, email, and plaintext password to the console so you can log in immediately.
5. Handles any error (e.g. a database connection failure) with a clear message and a non-zero exit code, rather than a raw stack trace.

### Configuring the admin's credentials

By default, the seeder creates:

| Field | Default value |
|---|---|
| Name | `System Administrator` |
| Email | `admin@cmp.local` |
| Password | `Admin@12345` |
| Phone | `9999999999` |

To use your own values instead, set these environment variables before running the script (either export them in your shell, or add them temporarily to `server/.env`):

```bash
ADMIN_NAME="Jane Doe"
ADMIN_EMAIL="jane@example.com"
ADMIN_PASSWORD="SomeStrongerPassword123"
ADMIN_PHONE="5551234567"
```

**Change the default password immediately after first login if you used the defaults** — they are intentionally simple/well-known for convenience in local development, not meant to be used as-is anywhere the database is reachable by anyone else.

### Rerunning it safely

Rerunning `npm run seed:admin` is always safe: it only ever creates an Admin the very first time. On every later run it detects the existing Admin and exits cleanly with a message, doing nothing further. If you genuinely want a **second** Admin account, set `ADMIN_EMAIL` to a new address before rerunning — the "any Admin already exists" check is a safety guard against accidentally creating duplicates, not a hard limit of one Admin ever.

---

## 2. Creating demo data (optional)

```bash
cd server
npm run seed:demo
```

This runs `server/src/seeders/demoDataSeeder.js`, which requires that **an Admin account already exists** (run `seed:admin` first). It then creates a realistic, connected set of demo records by calling the exact same service-layer functions the real API uses (`complaint.service.js`'s `createComplaint`, `admin.service.js`'s `assignComplaint`, etc.) — so the seeded data triggers the same complaint-ID generation, timeline entries, and notifications a real user's actions would. Nothing is written directly to MongoDB collections by hand.

It creates:

| Resource | Count | Details |
|---|---|---|
| Departments | 3 | Water Supply Department, Roads & Infrastructure, Electricity Department |
| Categories | 2 per department (6 total) | e.g. "Pipeline Leak" / "No Water Supply" under Water Supply |
| Officers | 1 per department (3 total) | Each pre-assigned to their department, ready to receive complaints |
| Citizens | 2 | `citizen.one@demo.cmp`, `citizen.two@demo.cmp` |
| Complaints | 4 | Deliberately left in different lifecycle states — one `Pending`, one `Assigned`, one `In Progress`, one `Resolved` — so dashboards, filters, and status badges all have something meaningful to show |
| Notifications | Generated automatically | A side effect of calling the real assignment/status-update service functions, exactly like the real app |

All demo citizen and officer accounts use the same password (default `Demo@12345`, overridable via a `DEMO_PASSWORD` environment variable, same pattern as the admin seeder).

### Rerunning it safely

The demo seeder checks whether its first demo department ("Water Supply Department") already exists, and if so, **skips entirely** and does nothing — it will not create duplicate departments/citizens/complaints on a second run. This is intentionally simple rather than fully idempotent per-record: if you want a completely fresh set of demo data, drop the database (or at minimum the `departments`, `categories`, `users`, `complaints`, `complainttimelines`, and `notifications` collections) before rerunning, rather than expecting the script to reconcile partial state.

### Demo data is optional and separate from production data

Nothing about deployment or normal app operation requires the demo seeder. It exists purely for local development and demonstrations. **Do not run `npm run seed:demo` against a real production database** — it will create fake departments, categories, and complaints that have no business being there. It is safe and expected to run in a fresh local or classroom-only database.

---

## Quick reference

| Command | What it does | Safe to rerun? |
|---|---|---|
| `npm run seed:admin` | Creates the first Admin account | Yes — detects and skips if one already exists |
| `npm run seed:demo` | Creates demo departments/categories/officers/citizens/complaints | Yes, but skips entirely (does nothing) if demo data already exists; for a truly fresh set, clear the database first |

**Recommended order for a brand-new database:** `npm run seed:admin` → log in as Admin once to confirm it works → optionally `npm run seed:demo` for a fuller demo environment.
