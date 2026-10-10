# Backend API contract

What the Vue frontend in `frontend/` calls. Every route is authenticated except
`sign-in`. HR routes additionally require `role = hr`.

Base path `/api`. Auth: `Authorization: Bearer <token>` on every request after
sign-in. Responses are JSON unless noted.

Terminology: **document** = one policy file and its versions. **section** = one
indexed chunk of a document, and the unit that gets cited.

---

## 1. Auth

### POST /auth/sign-in
Public.

```json
{ "email": "riya.menon@acme.co", "password": "…" }
```

```json
{
  "user": { "id": "u-riya", "name": "Riya Menon", "email": "…", "role": "employee", "team": "…" },
  "token": "…",
  "expires_at": "2026-09-21T09:00:00Z"
}
```

`role` is `employee` or `hr`. The frontend sends HR straight to `/hr/documents`
and employees to `/ask`.

### POST /auth/sign-out
No body. Always 204, even if the token has already expired.

---

## 2. Employee chat

### POST /chat/answers
Send: `{ "question": "How many annual leave days can I carry over?", "thread_id": "thread-1" }`
(`thread_id` omitted on the first question of a thread.)

Response — `outcome` is one of `answered`, `refused`.

```json
{
  "message": {
    "id": "m-2",
    "outcome": "answered",
    "content": "Up to 10 unused days carry into the following year…",
    "created_at": "2026-09-18T09:12:06Z",
    "sources": [
      {
        "document_id": "doc-leave",
        "title": "Leave and Time Off Policy",
        "version": "4.2",
        "section": "2. Carry-over and encashment",
        "excerpt": "A maximum of 10 unused days may be carried…",
        "note": "Carry-over limit was raised to 10 days for 2026–27."
      }
    ]
  }
}
```

Rules the UI depends on:

- `outcome: "refused"` must come back with `sources: []`. The UI shows the
  refusal notice and records the term as a gap.
- `excerpt` is the verbatim policy text, not a summary.
- `version` is the version the answer was generated from, so it stays readable
  after the document is updated.
- `note` is the HR note for that document, shown under the excerpt. Empty string
  when there is none.
- Only `active` documents may be cited.

Streaming: `Accept: text/event-stream` on the same route may send `content`
deltas instead. The UI reveals text progressively, so a non-streaming JSON
response also works.

### GET /chat/threads
`{ "threads": [ { "id", "title", "created_at", "preview" } ] }`
Newest first. `preview` is the first 100 characters of the last message.

### GET /chat/threads/{id}
`{ "thread": { "id", "title", "created_at", "messages": [ …full message objects… ] } }`
The employee may only read their own thread; another user's id returns 404.

### DELETE /chat/threads/{id}
204. Removes the employee's thread only. Does not touch documents, other
employees' answers, or the question log.

### PUT /chat/messages/{id}/rating
`{ "value": "up" }` or `{ "value": "down" }`. Sending the value the user already
gave clears it, so the same endpoint toggles. 204.

---

## 3. Policy library (employee view)

### GET /documents
`?q=&category=` — both optional. Returns `status: "active"` documents only.

```json
{
  "documents": [
    {
      "id": "doc-leave",
      "title": "Leave and Time Off Policy",
      "category": "Leave",
      "version": "4.2",
      "status": "active",
      "effective_date": "2026-04-01",
      "expiry_date": "2027-03-31",
      "pages": 9,
      "file_name": "leave-and-time-off-v4.2.pdf",
      "file_type": "PDF",
      "size_kb": 412,
      "updated_at": "2026-08-14T09:20:00Z",
      "updated_by": "Anita Rao",
      "note": "",
      "sections": [ { "id", "heading", "body", "keywords": [] } ]
    }
  ],
  "categories": ["Leave", "Payroll", "…"]
}
```

`q` matches title, headings, and section bodies. `categories` powers the filter
chips and should include every category that has at least one active document.

### GET /documents/{id}
Same object. 404 if the document is not active or does not exist — employees
cannot see drafts.

---

## 4. HR — documents

### GET /admin/documents
`?q=&status=all|active|inactive|archived`. All statuses, plus `index_status`
and the counts used in the page header.

```json
{
  "documents": [ { "id", "title", "category", "version", "status",
                   "index_status", "file_name", "size_kb",
                   "updated_at", "updated_by", "section_count" } ],
  "counts": { "active": 8, "not_visible": 1, "sections": 27 }
}
```

`status` is `active`, `inactive`, or `archived`.
`index_status` is `queued`, `processing`, `indexed`, or `failed`. A failed
index needs `index_error` with a reason the UI can show.

### POST /admin/documents
Upload. `multipart/form-data`.

| Field | Required | Notes |
|---|---|---|
| `file` | yes | PDF, DOCX, TXT, MD. Reject over 25 MB. |
| `title` | yes | Defaults to the file name without extension. |
| `category` | yes | Must be in the category list. |
| `version` | no | Defaults to `1.0`. |
| `status` | no | `active` (default) or `inactive`. |
| `effective_date` | no | `YYYY-MM-DD`. |
| `expiry_date` | no | `YYYY-MM-DD`. |
| `note` | no | Shown under the citation. |

Returns `202` with the document, `index_status: "queued"`.

```
202 { "document": { "id": "doc-173", "index_status": "queued", … } }
```

### GET /admin/documents/{id}
Full document including `sections` and `note`, in any status.

### PATCH /admin/documents/{id}
Metadata only. Any of `title`, `category`, `version`, `status`, `effective_date`,
`expiry_date`, `note`. 200 with the updated document. Records an audit entry.

### POST /admin/documents/{id}/file
Replace the source file. `multipart/form-data`, field `file`. Bumps `version`,
extracts text, sets `index_status: "processing"`, and marks the previous version
inactive. Answers already given keep their original citation. 200 with the
document.

### POST /admin/documents/{id}/status
`{ "status": "inactive" }`. 200 with the document. `active` makes it searchable
again.

### POST /admin/documents/{id}/reindex
Re-extract and re-index. 202 with `index_status: "processing"`.

### GET /admin/documents/{id}/index-status
→ `{ "index_status": "processing", "index_error": null, "section_count": 0 }`
The upload page polls this while work is in progress.

### DELETE /admin/documents/{id}
204. Removes the document from search and from future answers. Past answers keep
their citation text so the log stays readable.

---

## 5. HR — question log

### GET /admin/questions
`?q=&outcome=all|answered|refused`. Newest first, paginated.

```json
{
  "questions": [
    {
      "message_id": "m-2",
      "thread_id": "thread-1",
      "question": "How many annual leave days can I carry into next year, and can I encash them?",
      "answer": "Up to 10 unused days carry…",
      "outcome": "answered",
      "sources": [ { "document_id", "title", "version", "section", "excerpt", "note" } ],
      "rating": "up",
      "asked_by": { "id": "u-riya", "name": "Riya Menon" },
      "asked_at": "2026-09-18T09:12:06Z"
    }
  ],
  "totals": { "logged": 3, "answered": 3, "refused": 0, "helpful": 1 },
  "next_cursor": null
}
```

`rating` is `up`, `down`, or `null`. The log holds the question, the answer, and
the cited sections — not the document text beyond the excerpt.

### POST /admin/questions/recheck
Re-runs a logged question against the current index.
`{ "question": "…" }` → the same message object as `/chat/answers`. Used to show
an HR user whether an answer changed after a policy update.

---

## 6. HR — content gaps

### GET /admin/gaps
Sorted by search count, descending.

```json
{
  "gaps": [
    { "term": "sabbatical", "searches": 14,
      "first_seen": "2026-08-02", "last_seen": "2026-09-19" }
  ]
}
```

Recorded server-side whenever an answer comes back `refused`.

### DELETE /admin/gaps/{term}
Marks the term as covered and removes it from the list. 204.

---

## 7. HR — audit

### GET /admin/audit
Newest first. Upload, edit, activation, deactivation, archive, and delete.

```json
{ "entries": [ { "id", "at", "actor": "Anita Rao", "action": "edited",
                 "target": "Leave and Time Off Policy", "detail": "carry-over limit set to 10 days" } ] }
```

`action` is one of `uploaded`, `edited`, `activated`, `deactivated`, `archived`,
`deleted`, `reindexed`.

---

## Errors

```json
{ "error": { "code": "no_supporting_policy", "message": "No active policy covers this question." } }
```

| Status | Code | When |
|---|---|---|
| 400 | `validation_failed` | Missing or malformed field. `fields` lists what failed. |
| 401 | `not_authenticated` | Missing, expired, or invalid token. |
| 403 | `not_permitted` | Employee calling an HR route. |
| 404 | `not_found` | Wrong id, or a document that is not visible to this role. |
| 409 | `duplicate_email` | HR email already has an account. |
| 413 | `file_too_large` | Upload over the size limit. |
| 415 | `unsupported_file_type` | Not PDF, DOCX, TXT, or MD. |
| 422 | `no_text_layer` | Scanned PDF with no extractable text. |
| 500 | `model_unavailable` | Answer generation failed. Must not return a partial answer. |
| 503 | `indexing_in_progress` | Document exists but is not searchable yet. |

The frontend never shows a partial answer as if it were a result: a 500 on
`/chat/answers` renders an error state, and the thread stays on the last
successful message.

## Behaviours the UI cannot work without

1. **Refusal is a real outcome.** No supporting policy means `refused` with no
   sources. Never a guess dressed as an answer.
2. **Version pinning.** `sources[].version` is the version that was read, so a
   citation stays meaningful after the document changes.
3. **Active only.** Inactive, expired, archived, and pending-index documents are
   never cited and never appear in the employee library.
4. **Upload progress.** An uploaded document is searchable within two minutes, so
   `index_status` has to be pollable while work is in flight.
5. **Reversible actions.** Every destructive action in the UI is a delete or
   status change that can be undone by HR with another call.
