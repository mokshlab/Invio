# Invio API Reference

Base URL: `/api`

All protected endpoints require a `Bearer` token in the `Authorization` header. Tokens are obtained via login/signup and refreshed via the refresh endpoint.

---

## Authentication

Rate limit: **15 requests / 15 min** per IP

### POST /auth/signup

Create a new user account.

**Body**

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `name` | string | Yes | 2–50 characters |
| `email` | string | Yes | Valid email, lowercased |
| `password` | string | Yes | 6–100 characters |

**201 Created**

```json
{
  "user": { "_id": "...", "name": "...", "email": "..." },
  "accessToken": "JWT"
}
```

Sets `refreshToken` as an httpOnly cookie.

**Errors**: `400` — email already exists, validation errors

---

### POST /auth/login

**Body**

| Field | Type | Required |
|-------|------|----------|
| `email` | string | Yes |
| `password` | string | Yes |

**200 OK** — same shape as signup response.

**Errors**: `401` — invalid email or password

---

### POST /auth/refresh

Exchange refresh token cookie for a new access token. No body required — the browser sends the `refreshToken` cookie automatically.

**200 OK**

```json
{ "accessToken": "JWT" }
```

Sets a rotated `refreshToken` cookie.

**Errors**: `401` — missing/invalid/expired refresh token

---

### POST /auth/logout

Clears the refresh token cookie. No body required.

**200 OK**

```json
{ "message": "Logged out successfully" }
```

---

### GET /auth/me 🔒

Returns the authenticated user's profile.

**200 OK**

```json
{
  "user": {
    "_id": "...",
    "name": "...",
    "email": "...",
    "businessName": "...",
    "businessEmail": "...",
    "businessPhone": "...",
    "businessAddress": "...",
    "businessLogo": "...",
    "taxId": "..."
  }
}
```

---

## Invoices

All endpoints require authentication. Rate limit: **200 requests / 15 min** (global).

### POST /invoices 🔒

Create a new invoice. Invoice number is auto-generated as `INV-YYYY-NNNN`.

**Body**

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `clientName` | string | Yes | 1–200 chars |
| `clientEmail` | string | No | Valid email, max 254 chars |
| `clientPhone` | string | No | Max 30 chars |
| `clientAddress` | string | No | Max 500 chars |
| `issueDate` | string | No | ISO date, defaults to now |
| `dueDate` | string | No | ISO date |
| `items` | array | Yes | 1–100 items |
| `items[].description` | string | Yes | Non-empty |
| `items[].quantity` | number | Yes | > 0 |
| `items[].rate` | number | Yes | >= 0 |
| `items[].amount` | number | No | Calculated |
| `taxRate` | number | No | 0–100, default 0 |
| `discount` | number | No | >= 0, default 0 |
| `notes` | string | No | Max 2000 chars |
| `terms` | string | No | Max 2000 chars |
| `status` | string | No | `draft` (default), `sent`, `paid`, `overdue` |

**201 Created** — returns `{ "invoice": { ... } }` with all computed fields.

---

### GET /invoices 🔒

Paginated list filtered to the current user.

**Query Parameters**

| Param | Type | Default | Notes |
|-------|------|---------|-------|
| `status` | string | all | Comma-separated: `draft,sent` |
| `search` | string | — | Searches invoiceNumber, clientName, clientEmail |
| `sort` | string | `-createdAt` | Allowed: `createdAt`, `dueDate`, `total`, `clientName`, `invoiceNumber`, `status`. Prefix `-` for descending |
| `page` | integer | 1 | >= 1 |
| `limit` | integer | 10 | 1–100 |

**200 OK**

```json
{
  "invoices": [ ... ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 42,
    "pages": 5
  }
}
```

---

### GET /invoices/stats 🔒

Aggregated analytics for the authenticated user.

**200 OK**

```json
{
  "stats": {
    "totalInvoices": 42,
    "totalRevenue": 125000,
    "pendingAmount": 34000,
    "statusBreakdown": [{ "_id": "paid", "count": 20, "total": 125000 }],
    "monthlyRevenue": [{ "_id": { "year": 2025, "month": 6 }, "revenue": 15000, "count": 5 }],
    "topClients": [{ "_id": "Acme Corp", "totalRevenue": 50000, "invoiceCount": 8, "email": "..." }]
  },
  "recentInvoices": [ ... ]
}
```

---

### GET /invoices/email-status 🔒

Check if SMTP is configured.

**200 OK** — `{ "configured": true }`

---

### GET /invoices/:id 🔒

Returns a single invoice owned by the current user.

**Errors**: `404` — not found or not owned by user

---

### PUT /invoices/:id 🔒

Partial update. All body fields are optional. Status transitions are enforced:

| Current Status | Allowed Transitions |
|----------------|-------------------|
| `draft` | `sent` |
| `sent` | `paid`, `overdue` |
| `overdue` | `paid` |
| `paid` | *(none)* |

**Errors**: `400` — invalid status transition, `404` — not found

---

### DELETE /invoices/:id 🔒

**200 OK** — `{ "message": "Invoice deleted successfully" }`

---

### POST /invoices/:id/send 🔒

Sends the invoice to the client's email. Auto-transitions status from `draft` → `sent`.

**200 OK**

```json
{
  "message": "Invoice sent to client@example.com",
  "preview": false,
  "invoice": { ... }
}
```

If SMTP is not configured, `preview` is `true` and the email is logged to console.

**Errors**: `400` — no client email, `404` — not found

---

### GET /invoices/:id/activity 🔒

Returns the last 50 audit log entries for the invoice.

**200 OK**

```json
{
  "activity": [
    {
      "action": "created | updated | status_changed | deleted | email_sent",
      "details": { ... },
      "createdAt": "2025-01-15T10:00:00Z"
    }
  ]
}
```

---

### POST /invoices/bulk-delete 🔒

Delete multiple invoices at once.

**Body**

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `ids` | string[] | Yes | 1–50 MongoDB ObjectIds |

**200 OK** — `{ "message": "5 invoice(s) deleted successfully", "deletedCount": 5 }`

---

## Profile

All endpoints require authentication.

### GET /profile 🔒

Returns full user profile including business details.

---

### PUT /profile 🔒

**Body**

| Field | Type | Constraints |
|-------|------|-------------|
| `name` | string | 2–50 chars |
| `businessName` | string | Max 100 chars |
| `businessEmail` | string | Valid email |
| `businessPhone` | string | Max 20 chars |
| `businessAddress` | string | Max 200 chars |
| `businessLogo` | string | URL or base64 |
| `taxId` | string | Max 30 chars |

All fields optional.

---

### PUT /profile/password 🔒

**Body**

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `currentPassword` | string | Yes | — |
| `newPassword` | string | Yes | Min 6 chars |

**Errors**: `400` — current password incorrect

---

## AI

All endpoints require authentication. Rate limit: **50 requests / 15 min** per IP.

Returns `503` if `GEMINI_API_KEY` is not configured.

### POST /ai/generate-invoice 🔒

Convert natural language into structured invoice data.

**Body**

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `text` | string | Yes | 10–5000 chars |

**200 OK**

```json
{
  "message": "Invoice data generated successfully",
  "invoice": {
    "clientName": "...",
    "clientEmail": "...",
    "items": [{ "description": "...", "quantity": 1, "rate": 100, "amount": 100 }],
    "taxRate": 0,
    "discount": 0,
    "notes": "...",
    "terms": "..."
  }
}
```

---

### POST /ai/payment-reminder 🔒

Generate a payment reminder email for an unpaid invoice.

**Body**

| Field | Type | Required | Default |
|-------|------|----------|---------|
| `invoiceId` | string | Yes | — |
| `tone` | string | No | `professional` |

Tone options: `friendly`, `professional`, `urgent`

**200 OK** — `{ "reminder": { "subject": "...", "html": "..." } }`

**Errors**: `404` — invoice not found, `400` — invoice already paid

---

### POST /ai/send-reminder 🔒

Send a previously generated reminder via email.

**Body**

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `invoiceId` | string | Yes | — |
| `reminderText` | string | Yes | 1–5000 chars |

**Errors**: `400` — no client email, `404` — invoice not found

---

### GET /ai/insights 🔒

AI-generated business insights from invoice history.

**200 OK**

```json
{
  "insights": {
    "summary": "...",
    "trends": "...",
    "opportunities": "..."
  },
  "meta": {
    "invoicesAnalysed": 42,
    "totalRevenue": 125000,
    "pendingAmount": 34000
  }
}
```

Requires at least 2 invoices. **Errors**: `400` — fewer than 2 invoices

---

## Public

No authentication required.

### GET /public/invoices/:token

Returns a read-only invoice by its 128-bit share token. Does not expose `_id`, `user`, `shareToken`, or timestamps.

**Errors**: `404` — invalid or unknown token

---

## Health

### GET /health

**200 OK** — `{ "status": "ok", "timestamp": "..." }`

---

## Error Format

All errors follow a consistent structure:

```json
{
  "message": "Human-readable error description",
  "statusCode": 400
}
```

| Code | Meaning |
|------|---------|
| `400` | Validation error or invalid request |
| `401` | Missing, invalid, or expired token |
| `404` | Resource not found or not owned by user |
| `429` | Rate limit exceeded |
| `502` | AI service returned unparseable response |
| `503` | Required external service not configured |
| `500` | Unhandled server error |
