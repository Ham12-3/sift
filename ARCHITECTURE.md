# Architecture

Sift is a two-tier application: a **Next.js** frontend and a **NestJS** API backed by **MongoDB**. AI calls are delegated to whatever **OpenAI-compatible** provider the user configures. This document explains each tier, the data model, and the AI flow.

```
┌──────────────────────────┐        HTTPS / JSON (JWT)        ┌──────────────────────────┐
│        Frontend          │  ───────────────────────────►   │         Backend          │
│  Next.js (App Router)    │                                 │        NestJS API        │
│  TypeScript + Tailwind   │   ◄───────────────────────────  │   (feature modules)      │
└──────────────────────────┘                                 └────────────┬─────────────┘
                                                                          │ Mongoose
                                                       OpenAI SDK         ▼
                                              ┌─────────────────┐   ┌───────────┐
                                              │  AI provider     │   │  MongoDB  │
                                              │ OpenAI / LM      │   └───────────┘
                                              │ Studio / Ollama  │
                                              └─────────────────┘
```

A key design decision: **the backend never bundles an AI key of its own.** Each user stores their own provider config; the backend decrypts it per request and calls the provider directly. This satisfies the "configurable, not hardcoded" requirement and keeps inference cost/ownership with the user.

---

## Frontend architecture

**Framework:** Next.js 14 (App Router), TypeScript, Tailwind CSS. The visual design is a faithful implementation of `design/Sift.dc.html` — its palette, typography (Geist / Geist Mono / Bricolage Grotesque), severity colors, and component styling are encoded as Tailwind tokens in `tailwind.config.ts` and `globals.css`.

### Routing

| Route | Purpose | Protected |
| --- | --- | --- |
| `/` | Marketing landing page | No |
| `/auth` | Login / register (tabbed) | No |
| `/dashboard` | Projects grid + create/delete | Yes |
| `/projects/[id]/explorer` | File tree + code preview + upload | Yes |
| `/projects/[id]/review` | Run reviews, view results & per-project history | Yes |
| `/projects/[id]/chat` | Chat with the codebase | Yes |
| `/history` | Global, searchable review history | Yes |
| `/settings` | AI provider configuration | Yes |

Authenticated pages live under a route group `src/app/(app)/` whose layout renders the sidebar and **guards access** — it redirects to `/auth` when there is no session. Project-scoped pages share a `projects/[id]/layout.tsx` that loads the project once, exposes it via `ProjectProvider` context, and renders the Explorer/Review/Chat tab bar.

### State & data flow

- **Auth** is a React context (`lib/auth.tsx`) that restores the session on mount via `GET /auth/me`, exposes `login`/`register`/`logout`, and stores the JWT in `localStorage`.
- **API access** goes through one typed wrapper (`lib/api.ts`) that injects the `Authorization` header, shapes errors into `ApiError`, and performs a global `401 → /auth` redirect.
- **Active project** — the sidebar's project-scoped links (Explorer/Review/Chat) need a target, so the last-opened project id is persisted in `localStorage` (`lib/util.ts`).
- Components are deliberately presentational + local-state; there is no global store, which keeps the surface small and matches the app's mostly page-local data needs.

### Notable components

- `CodeViewer` — highlight.js with a line-number gutter and a token theme matching the mockup.
- `FileTree` — recursive, collapsible folder tree.
- `UploadActions` + `lib/dropfiles.ts` — ZIP/folder/GitHub uploads, including recursive directory traversal for drag-and-drop so folder structure is preserved.

---

## Backend architecture

**Framework:** NestJS 10 with Mongoose. Code is split into cohesive feature modules, each owning its schema, service (business logic), and controller (HTTP):

```
src/
├── auth/        # register/login/logout, JWT strategy + guard
├── users/       # user schema + lookup
├── projects/    # CRUD + cascade delete of a project's artifacts
├── files/       # ZIP/folder/GitHub ingestion, tree building, file reads
├── reviews/     # review engine: prompt build → AI call → parse → persist
├── providers/   # AI provider CRUD, API-key encryption, connection test
├── chat/        # chat sessions/messages + retrieval-grounded answers
├── ai/          # AiClientService — OpenAI-compatible client (shared)
└── common/      # decorators (CurrentUser) and cross-cutting helpers
```

### Cross-cutting concerns

- **Validation** — global `ValidationPipe` with `whitelist` + `forbidNonWhitelisted`; every request body is a `class-validator` DTO.
- **Auth** — `JwtStrategy` (Passport) validates the bearer token; `JwtAuthGuard` protects controllers. `request.user` is exposed via a `@CurrentUser()` decorator.
- **Ownership** — services load resources by id **and** assert the resource's `owner` matches the caller, returning `404/403` otherwise. This is the authorization boundary for every project, file, review, provider, and chat operation.
- **Secrets** — provider API keys are encrypted with AES-256-GCM (`providers/crypto.util.ts`) before storage and only decrypted in-memory at call time; responses expose just a masked hint (`••••abcd`).
- **Ingestion hygiene** — `files/file-utils.ts` skips ignored directories (`node_modules`, `.git`, build output), binary files (NUL-byte heuristic), and oversized files; it derives language from the extension for highlighting.

### Request lifecycle (example: run a review)

```
POST /api/projects/:id/reviews  { template, paths, providerId? }
  → JwtAuthGuard            (authenticate)
  → ReviewsService.create   (assert project ownership)
      → FilesService        (gather selected files within a char budget)
      → ProvidersService    (resolve + decrypt provider config)
      → AiClientService     (OpenAI-compatible chat completion, JSON mode)
      → parse + normalize   (tolerant JSON parse, severity counts)
      → persist Review      (status completed/failed)
  → 200 serialized review
```

---

## Database design

MongoDB via Mongoose. Documents use `timestamps` (`createdAt`/`updatedAt`). Ownership is modeled with `ObjectId` references; there are no cross-document transactions — cascade deletes are performed explicitly in `ProjectsService.remove`.

| Collection | Key fields | Notes / indexes |
| --- | --- | --- |
| **users** | `email` (unique), `name`, `passwordHash` | Password is bcrypt-hashed; never serialized to clients. |
| **projects** | `owner→User`, `name`, `description`, `fileCount` | `fileCount` denormalized; indexed by `owner`. |
| **codefiles** | `project→Project`, `path`, `language`, `size`, `content` | Unique compound index `(project, path)` — re-upload overwrites. |
| **reviews** | `project`, `owner`, `template`, `scope`, `targetPaths[]`, `status`, `summary`, `issues[]`, `recommendations[]`, `topSeverity`, `severityCounts`, `model` | `issues[]` is an embedded sub-schema (title, description, severity, file, line, recommendation). Text index on `summary`+`targetPaths`. |
| **aiproviders** | `owner`, `name`, `baseUrl`, `modelName`, `apiKeyEncrypted`, `apiKeyHint`, `isDefault` | Exactly one default per user is enforced in the service. `modelName` avoids Mongoose's reserved `Document.model`. |
| **chatsessions** | `project`, `owner`, `title` | Title is seeded from the first question. |
| **chatmessages** | `session`, `project`, `role`, `content`, `citedFiles[]` | `project` denormalized to enable cascade delete. |

This matches the suggested schema (Users, Projects, Files, Reviews, AI Providers, Chat Sessions, Messages). Embedding `issues[]` inside a review (rather than a separate collection) reflects that issues are always read and written together with their parent review.

---

## AI integration flow

### Provider abstraction

`AiClientService` wraps the official `openai` SDK. Because the SDK only needs a `baseURL` + `apiKey`, one code path serves **every** OpenAI-compatible backend (OpenAI, LM Studio, Ollama's `/v1`, OpenRouter, custom). Local servers that need no key get a placeholder so the SDK is satisfied. The service exposes `complete()` (with optional JSON mode) and `testConnection()`.

### Review engine

1. **Select files** — entire project, or a chosen subset of paths.
2. **Build prompt** — a mode-specific system prompt (`reviews/prompts.ts`) lists the focus areas for Security / Performance / Code Quality and specifies an **exact JSON output contract**. Selected files are concatenated into a fenced, path-labelled context block bounded by a character budget (large repos are truncated gracefully).
3. **Call the model** in JSON mode (`response_format: json_object`) for reliable structure.
4. **Parse defensively** — code fences are stripped and the JSON object is isolated before `JSON.parse`; issues are normalized (severity clamped to the allowed set, line numbers coerced).
5. **Aggregate & persist** — per-severity counts and `topSeverity` are computed for fast history badges; the review is saved as `completed` (or `failed` with the error).

### Chat with code (retrieval)

The assessment permits simple retrieval, so `chat/retrieval.ts` scores each file by keyword overlap between the question and the file's path (weighted higher) and content, selects the top-N files within a budget, and passes them as grounding context. The system prompt instructs the model to cite file paths and to say so when the answer isn't in the provided files. Recent turns are replayed for continuity, and the cited files are stored on the assistant message.

### Why this shape

- **Strict-JSON + tolerant parsing** balances structure (so the UI can render severity cards and issue lists) against the reality that models occasionally wrap output in prose.
- **Per-user providers** keep keys, cost, and model choice with the user and make local/offline models first-class.
- **Synchronous reviews** keep the flow simple and observable for this scope; the `status` field and persisted error leave a clean path to move long reviews onto a queue later without changing the data model.
