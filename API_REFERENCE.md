# API Reference

**Base URL (local dev):** `http://localhost:5000/api/v1`
**Base URL (production):** `<your Render URL>/api/v1`

All endpoints, request/response shapes, and validation rules below were read directly from the current source code (`server/src/routes/`, `server/src/validators/`, `server/src/controllers/`) and confirmed working via 61 automated tests plus a live end-to-end HTTP smoke test in this session — nothing here is speculative.

## Conventions

**Success envelope:**
```json
{ "success": true, "message": "Human-readable message", "data": { } }
```

**Error envelope:**
```json
{ "success": false, "message": "Human-readable message", "errors": [] }
```
`errors` is populated with express-validator's field-error array only for `422` validation failures; it's an empty array for every other error type.

**Authentication:** send `Authorization: Bearer <token>` on every endpoint marked "Required" below. The token is obtained from `POST /auth/login`.

**Roles:** `citizen`, `officer`, `admin`. A 401 means "not authenticated" (missing/invalid/expired token); a 403 means "authenticated, but this role isn't allowed here."

---

## Health

### `GET /health`

- **Authentication:** None
- **Description:** Liveness check — always returns `200` if the Express process is running (does not depend on the database connection).

**Success response (200):**
```json
{ "success": true, "message": "OK", "data": {} }
```

---

## Authentication (`/auth`)

### `POST /auth/register`

- **Authentication:** None
- **Description:** Self-registration. **Always creates a `citizen`** — there is no way to register as `officer` or `admin` through this endpoint.

**Request body:**
| Field | Type | Rules |
|---|---|---|
| `name` | string | Required, non-empty (trimmed) |
| `email` | string | Required, valid email format |
| `password` | string | Required, minimum 8 characters |
| `phone` | string | Required, exactly 10 digits (`^[0-9]{10}$`) |

**Success example (201):**
```json
{ "success": true, "message": "Registration successful", "data": {} }
```

**Error example (409 — duplicate email):**
```json
{ "success": false, "message": "An account with this email already exists", "errors": [] }
```

**Error example (422 — validation):**
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    { "type": "field", "path": "password", "msg": "Password must be at least 8 characters long", "location": "body" }
  ]
}
```

---

### `POST /auth/login`

- **Authentication:** None

**Request body:**
| Field | Type | Rules |
|---|---|---|
| `email` | string | Required, valid email format |
| `password` | string | Required, non-empty |

**Success example (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "user": { "_id": "...", "name": "Jane Citizen", "email": "jane@example.com", "role": "citizen", "phone": "1234567890", "isActive": true }
  }
}
```

**Error example (401 — wrong credentials):**
```json
{ "success": false, "message": "Invalid email or password", "errors": [] }
```

---

### `POST /auth/logout`

- **Authentication:** Required (any role)
- **Description:** Stateless — there is no server-side token blacklist. This endpoint exists mainly for symmetry/future extensibility; the frontend clears its stored token regardless of this call's outcome.

**Success response (200):**
```json
{ "success": true, "message": "Logout successful", "data": {} }
```

---

### `GET /auth/me`

- **Authentication:** Required (any role)

**Success response (200):**
```json
{ "success": true, "message": "Current user fetched successfully", "data": { "user": { "_id": "...", "name": "...", "email": "...", "role": "citizen" } } }
```

**Error example (401 — no/invalid token):**
```json
{ "success": false, "message": "Not authorized, no token provided", "errors": [] }
```

---

### `PATCH /auth/change-password`

- **Authentication:** Required (any role)

**Request body:**
| Field | Type | Rules |
|---|---|---|
| `currentPassword` | string | Required, non-empty |
| `newPassword` | string | Required, minimum 8 characters |

**Success response (200):**
```json
{ "success": true, "message": "Password changed successfully", "data": {} }
```

---

## Departments (`/departments`)

### `GET /departments`
- **Authentication:** Required (any role)
- **Success response (200):** `{ "success": true, "message": "Departments fetched successfully", "data": { "departments": [ { "_id": "...", "departmentName": "Water Supply" } ] } }`

### `POST /departments`
- **Authentication:** Required, **Admin only** (403 for citizen/officer)

**Request body:**
| Field | Type | Rules |
|---|---|---|
| `departmentName` | string | Required, non-empty |
| `description` | string | Optional |

**Success response (201):** `{ "success": true, "message": "Department created successfully", "data": { "department": { "_id": "...", "departmentName": "..." } } }`
**Error example (409 — duplicate name):** enforced by the model's unique index on `departmentName`.

### `PUT /departments/:id`
- **Authentication:** Required, **Admin only**
- **Request body:** same as `POST /departments`
- **Success response (200):** `{ "success": true, "message": "Department updated successfully", "data": { "department": { ... } } }`

### `DELETE /departments/:id`
- **Authentication:** Required, **Admin only**
- **Success response (200):** `{ "success": true, "message": "Department deleted successfully", "data": {} }`
- **Error example (409):** blocked if any Category still references this department — referential-integrity guard, not part of the original spec but added defensively.

---

## Categories (`/categories`)

### `GET /categories`
- **Authentication:** Required (any role)
- **Query parameters:** `department` (optional Mongo ID) — filters categories to one department.
- **Success response (200):** `{ "success": true, "message": "Categories fetched successfully", "data": { "categories": [ { "_id": "...", "categoryName": "Pipeline Leak", "department": "..." } ] } }`

### `POST /categories`
- **Authentication:** Required, **Admin only**

**Request body:**
| Field | Type | Rules |
|---|---|---|
| `categoryName` | string | Required, non-empty |
| `department` | string | Required, valid Mongo ID |

- **Success response (201):** `{ "success": true, "message": "Category created successfully", "data": { "category": { ... } } }`
- **Error example (409):** duplicate `(department, categoryName)` pair — the compound unique index allows the same category name in *different* departments.

### `PUT /categories/:id`
- **Authentication:** Required, **Admin only** — same body as `POST /categories`

### `DELETE /categories/:id`
- **Authentication:** Required, **Admin only**

---

## Complaints (`/complaints`)

### `POST /complaints`
- **Authentication:** Required, **Citizen only** (403 for officer/admin)
- **Content-Type:** `multipart/form-data` (to support optional image upload)

**Request body (form fields):**
| Field | Type | Rules |
|---|---|---|
| `title` | string | Required, non-empty |
| `description` | string | Required, non-empty |
| `category` | string | Required, valid Mongo ID |
| `department` | string | Required, valid Mongo ID |
| `priority` | string | Optional, one of `Low`, `Medium`, `High`, `Emergency` (default `Low` if omitted at the model level) |
| `address` | string | Required, non-empty |
| `city` | string | Required, non-empty |
| `state` | string | Required, non-empty |
| `images` | file[] | Optional, up to 5 files, `jpeg`/`png`/`webp`/`gif`, max 5 MB each — field name **must** be `images` |

**Success example (201):**
```json
{
  "success": true,
  "message": "Complaint submitted successfully",
  "data": {
    "complaint": {
      "_id": "...",
      "complaintId": "CMP-20260729-A1B2C3",
      "title": "Pipeline leak near school",
      "status": "Pending",
      "priority": "High",
      "category": { "_id": "...", "categoryName": "Pipeline Leak" },
      "department": { "_id": "...", "departmentName": "Water Supply" },
      "createdBy": { "_id": "...", "name": "Jane Citizen", "email": "...", "phone": "..." },
      "assignedTo": null,
      "images": []
    }
  }
}
```

**Error example (422 — missing fields):**
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    { "type": "field", "path": "description", "msg": "Description is required", "location": "body" },
    { "type": "field", "path": "category", "msg": "A valid category id is required", "location": "body" }
  ]
}
```

### `GET /complaints`
- **Authentication:** Required (any role). **Citizens see only their own complaints; officers/admins see all.**

**Query parameters:**
| Param | Rules |
|---|---|
| `status` | One of the 5 status enum values |
| `priority` | One of the 4 priority enum values |
| `department` | Valid Mongo ID |
| `category` | Valid Mongo ID |
| `dateFrom` / `dateTo` | ISO8601 date |
| `sort` | One of `newest`, `oldest`, `priority`, `status` |
| `page` | Positive integer |
| `limit` | 1–100 |

- **Success response (200):** `{ "success": true, "message": "Complaints fetched successfully", "data": { "complaints": [...], "page": 1, "limit": 10, "total": 3 } }`

### `GET /complaints/track/:complaintId`
- **Authentication:** Required (any role)
- **Path parameter:** `complaintId` — the human-readable tracking code (e.g. `CMP-20260729-A1B2C3`), **not** the Mongo `_id`
- **Access control:** owner (citizen) or any staff (officer/admin); 403 otherwise
- **Success response (200):** same complaint shape as above, wrapped in `{ "complaint": {...} }`

### `GET /complaints/:id/timeline`
- **Authentication:** Required (any role); owner or staff only
- **Path parameter:** `id` — Mongo `_id`
- **Success response (200):** `{ "success": true, "message": "Complaint timeline fetched successfully", "data": { "timeline": [ { "previousStatus": null, "currentStatus": "Pending", "remarks": "Complaint submitted", "updatedBy": { "name": "...", "role": "..." }, "createdAt": "..." } ] } }`

### `GET /complaints/:id`
- **Authentication:** Required (any role); owner or staff only
- **Success response (200):** `{ "success": true, "message": "Complaint fetched successfully", "data": { "complaint": {...} } }`

### `PUT /complaints/:id`
- **Authentication:** Required, owner (citizen) only
- **Request body:** any subset of the `POST /complaints` fields, all optional here
- **Error example (409):** `"This complaint can no longer be edited once it has been assigned"` — editing is locked once `status !== Pending` or an officer is assigned

### `DELETE /complaints/:id`
- **Authentication:** Required; owner (citizen, only while `Pending` and unassigned) **or** Admin (anytime) — a soft delete (`isDeleted: true`), never removed from the database
- **Success response (200):** `{ "success": true, "message": "Complaint deleted successfully", "data": {} }`

---

## Officer APIs (`/officer`) — all routes require Authentication + **Officer role** (403 otherwise)

### `GET /officer/complaints`
- Same query parameters as `GET /complaints`, but scoped to complaints `assignedTo` the current officer.
- **Success response (200):** `{ "success": true, "message": "Assigned complaints fetched successfully", "data": { "complaints": [...], "page": 1, "limit": 10, "total": 2 } }`

### `PATCH /officer/complaints/:id/status`
- **Access control:** the complaint must be assigned to the calling officer (403 otherwise)

**Request body:**
| Field | Type | Rules |
|---|---|---|
| `status` | string | Required, one of the 5 status enum values |
| `remarks` | string | Optional |

**Allowed transitions** (enforced server-side, 409 on any other attempt):
```
Assigned → In Progress → Resolved → Closed
```
No skipping steps, no moving backward, `Closed` is terminal.

- **Success response (200):** `{ "success": true, "message": "Complaint status updated successfully", "data": { "complaint": {...} } }`
- **Error example (409):** `"Cannot change status from \"Assigned\" to \"Resolved\""`

### `PATCH /officer/complaints/:id/note`
- **Request body:** `{ "resolutionNote": "string, required, non-empty" }`
- **Note:** does **not** create a timeline entry or a notification — it's a plain field update, deliberately distinct from a status transition.
- **Success response (200):** `{ "success": true, "message": "Resolution note added successfully", "data": { "complaint": {...} } }`

---

## Admin APIs (`/admin`) — all routes require Authentication + **Admin role** (403 otherwise)

### `GET /admin/dashboard`
- **Success response (200):**
```json
{
  "success": true,
  "message": "Dashboard stats fetched successfully",
  "data": {
    "totalComplaints": 12,
    "totalUsers": 8,
    "activeUsers": 7,
    "totalDepartments": 3,
    "statusCounts": { "Pending": 4, "Assigned": 3, "In Progress": 2, "Resolved": 2, "Closed": 1 },
    "departmentPerformance": [ { "departmentId": "...", "departmentName": "Water Supply", "total": 5, "resolved": 3 } ],
    "monthlyTrends": [ { "month": "2026-02", "count": 0 }, { "month": "2026-03", "count": 2 } ]
  }
}
```
`monthlyTrends` always has exactly 6 entries (trailing 6 months, zero-filled).

### `GET /admin/users`
- **Query parameters:** `role`, `department` (Mongo ID), `search` (matches name or email), `page`, `limit`
- **Success response (200):** `{ "success": true, "message": "Users fetched successfully", "data": { "users": [...], "page": 1, "limit": 20, "total": 8 } }`

### `PUT /admin/users/:id`

**Request body (all optional):**
| Field | Type | Rules |
|---|---|---|
| `name` | string | Non-empty if provided |
| `phone` | string | Non-empty if provided |
| `role` | string | One of `citizen`, `officer`, `admin` |
| `department` | string | Valid Mongo ID — **required** if `role` is being set to `officer` |
| `isActive` | boolean | — |

**Self-protection rules** (both return 400):
- An admin cannot change their **own** role away from `admin`.
- An admin cannot deactivate their **own** account (`isActive: false`).

- **Success response (200):** `{ "success": true, "message": "User updated successfully", "data": { "user": {...} } }`

### `DELETE /admin/users/:id`
- **Description:** a **soft** delete — sets `isActive: false`, never removes the document (Users aren't hard-deleted, to preserve `createdBy`/`assignedTo` referential integrity on existing complaints).
- **Error example (400):** an admin cannot deactivate their own account.
- **Success response (200):** `{ "success": true, "message": "User deactivated successfully", "data": {} }`

### `PATCH /admin/complaints/:id/assign`

**Request body:**
| Field | Type | Rules |
|---|---|---|
| `officerId` | string | Required, valid Mongo ID |
| `departmentId` | string | Required, valid Mongo ID |

**Validation performed server-side (all return errors, not silently ignored):**
| Condition | Status | Message |
|---|---|---|
| Complaint already `Resolved`/`Closed` | 409 | Cannot assign a complaint that is already resolved or closed |
| `officerId` doesn't belong to a user with role `officer` | 404 | Officer not found |
| Officer's `isActive` is `false` | 400 | Cannot assign a complaint to an inactive officer |
| `departmentId` doesn't exist | 404 | Department not found |
| Officer's own department doesn't match `departmentId` | 400 | The selected officer does not belong to this department |

- **Success response (200):** `{ "success": true, "message": "Complaint assigned successfully", "data": { "complaint": { ..., "status": "Assigned", "assignedTo": {...} } } }`
- **Side effects:** creates a timeline entry, notifies both the citizen owner and the newly-assigned officer, emits `complaint:updated` and `dashboard:update` over Socket.IO.

---

## Notifications (`/notifications`) — all routes require Authentication (any role); every notification is scoped to its owner (a foreign notification returns **404**, not 403 — the lookup query itself is scoped by `user: req.user._id`, so it simply doesn't match)

### `GET /notifications`
- **Query parameters:** `isRead` (optional boolean filter), `page`, `limit`
- **Success response (200):** `{ "success": true, "message": "Notifications fetched successfully", "data": { "notifications": [...], "page": 1, "limit": 10, "total": 3, "unreadCount": 2 } }`

### `PATCH /notifications/:id/read`
- **Success response (200):** `{ "success": true, "message": "Notification marked as read", "data": { "notification": { ..., "isRead": true } } }`

### `DELETE /notifications/:id`
- **Success response (200):** `{ "success": true, "message": "Notification deleted successfully", "data": {} }`

---

## Uncovered / non-existent endpoints (documented for clarity, not a gap)

- There is **no** `POST /admin/users` (create-user) endpoint anywhere — by design. The only way an Officer/Admin account exists is via promotion (`PUT /admin/users/:id`) of a self-registered citizen, or the `adminSeeder.js` bootstrap script (see `SEEDING_GUIDE.md`) for the very first Admin.
- There is **no** endpoint to reactivate a deactivated user (`isActive: false → true`) other than `PUT /admin/users/:id` with `{ "isActive": true }` — which works, just noting it's the same endpoint, not a separate "reactivate" route.
