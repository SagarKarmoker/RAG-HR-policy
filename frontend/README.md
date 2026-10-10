# HR Policy Assistant — frontend

Vue 3 + Vite. Interface for the employee chat and the HR admin dashboard, built to
`../design.md` (achromatic, hairline borders, 10px controls, system font).

## Run

```bash
pnpm install
pnpm dev      # http://localhost:5173
pnpm build
```

## Demo accounts

Password is `demo` for both. Sign in lands on `/ask` for employees and
`/hr/documents` for HR.

| Role     | Email                   |
|----------|-------------------------|
| Employee | riya.menon@acme.co      |
| HR admin | anita.rao@acme.co      |

## Routes

| Path                | View                                        |
|---------------------|---------------------------------------------|
| `/sign-in`          | Login                                       |
| `/ask`, `/ask/:id`  | Employee chat with citations and refusal    |
| `/library`          | Policy list, search, category filter        |
| `/library/:id`      | Full policy reader                          |
| `/hr/documents`     | Document table, status, re-index, delete    |
| `/hr/documents/:id` | Metadata, visibility, replace file          |
| `/hr/upload`        | Upload, extract, index                      |
| `/hr/questions`     | Question log with re-ask against live index |
| `/hr/gaps`          | Terms with no supporting policy             |

## Data

`src/lib/` is a mock of the backend contract. `seed.js` holds policies, threads and
gaps; `store.js` holds session and document state in `localStorage`;
`api.js` holds retrieval and answer generation. Replace `api.js` with real
`/api` calls — the Vite dev server already proxies `/api` to `localhost:8000`.

Requests the backend needs to honour, from the views above:
`signIn`, `askQuestion` (streams, returns cited sections or a refusal),
`saveDocument`, `setDocumentStatus`, `removeDocument`, `reindexDocument`,
`simulatedUpload`, `reaskQuestion`.

Refusals are the point: a question with no supporting policy must return
`outcome: 'refused'` and no sources, never a plausible guess.
