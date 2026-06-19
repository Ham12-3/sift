# AI Usage Report

This document discloses how AI tools were used to build Sift, as required by the assessment. It also distinguishes AI-generated from manually-directed work and records the key engineering decisions.

## AI tools used

- **Claude (Anthropic), via the Claude Code agentic CLI** — used as a pair-programmer to scaffold the NestJS backend and Next.js frontend, implement features, and write documentation.
- **Claude Design** — the original `Sift` mockup (`design/Sift.dc.html`) was produced as a design artifact and used as the visual source of truth; the React/Tailwind UI is a hand-verified implementation of it.

No other code-generation tools (Copilot, Cursor, etc.) were used for this submission.

## How AI was used (workflow)

The build was driven interactively: requirements (the assessment brief + the Sift design) were given to the model, which proposed an architecture, then generated code module-by-module. Every file was reviewed, and the stack was compiled/built after each tier to catch integration errors. The agent fixed type errors it introduced (e.g. the Mongoose `model` reserved-field collision, an `adm-zip` import style, and a `never[]` inference issue) before proceeding.

## Representative prompts

The work was done from a few high-level instructions rather than many copy-paste snippets. Paraphrased:

1. *"Build a production-oriented AI Code Review Assistant per this assessment brief. Frontend: Next.js + TypeScript + Tailwind. Backend: NestJS + MongoDB. Support configurable OpenAI-compatible providers (OpenAI, LM Studio, Ollama, OpenRouter) — not hardcoded. Implement all eight core features."*
2. *"Implement the Sift design (`Sift.dc.html`) faithfully — palette, Geist/Bricolage fonts, severity colors, sidebar app shell, landing, auth, dashboard, explorer, review, history, chat, settings."*
3. *"Encrypt provider API keys at rest; enforce per-user ownership on every resource; cascade-delete a project's files/reviews/chats."*
4. *"For the review engine, build mode-specific prompts (Security/Performance/Quality), request strict JSON, parse it defensively, and compute severity counts."*

## What was AI-generated

Effectively all source files were generated with AI assistance, then reviewed:

- **Backend** — all NestJS modules (`auth`, `users`, `projects`, `files`, `reviews`, `providers`, `chat`, `ai`), Mongoose schemas, DTOs, the OpenAI-compatible client, prompt templates, AES-256-GCM key encryption, ZIP/GitHub/drag-drop ingestion, and the keyword-retrieval chat.
- **Frontend** — all routes/pages, the auth context and typed API client, the design-system tokens (Tailwind config + global CSS lifted from the mockup), and components (`Sidebar`, `FileTree`, `CodeViewer`, `UploadActions`, `Modal`, `StatusBadge`, icon set).
- **Docs** — `README.md`, `ARCHITECTURE.md`, and this file.

## What was manually directed / reviewed

The human contribution was direction and judgement rather than typing:

- **Stack and scope choices** — NestJS + MongoDB (from the allowed options), and the decision to ship all core features.
- **The design** — provided as the binding visual spec; the implementation was checked against it (colors, type scale, layout, severity styling, the six-dot logo).
- **Architecture decisions** (below) were chosen deliberately, not accepted blindly.
- **Verification** — both `frontend` and `backend` were compiled/built successfully; type errors surfaced during the build were fixed.

Every line in the submission was read and is understood; the author can explain any part of it.

## Key engineering decisions

- **Providers are per-user and never hardcoded.** The backend ships with no AI key. Each user stores Base URL / key / model; the backend decrypts the key per request and calls the provider directly. One `AiClientService` (OpenAI SDK with a configurable `baseURL`) serves OpenAI, LM Studio, Ollama, and OpenRouter alike.
- **Secrets encrypted at rest.** Provider API keys are AES-256-GCM encrypted (key derived from `ENCRYPTION_KEY`); only a masked hint is ever returned to the client.
- **Strict-JSON reviews with tolerant parsing.** Reviews request JSON mode and a precise output contract so the UI can render summary/issues/recommendations and severity cards; parsing strips fences and isolates the JSON object to survive imperfect model output.
- **Ownership as the authorization boundary.** Every service loads a resource and asserts `owner === caller`, returning 404/403 otherwise — applied uniformly to projects, files, reviews, providers, and chats.
- **Explicit cascade deletes.** Deleting a project removes its files, reviews, chat sessions, and messages (MongoDB has no FK cascades), keeping data consistent.
- **Ingestion hygiene.** `node_modules`/`.git`/build output and binaries are skipped, oversized files are capped, and language is derived for highlighting — so uploads stay relevant and storage/AI-context stay bounded.
- **Simple, honest retrieval for chat.** Keyword-overlap scoring (path-weighted) selects context files and the answer cites them — sufficient for the brief, with a clear upgrade path to embeddings.
- **Small, modular structure over cleverness.** Feature modules with one responsibility each; presentational components with local state on the client. The goal was a maintainable, reviewable codebase rather than maximal feature count.

## Limitations / honest notes

- Reviews run synchronously; very large repositories are truncated to a context budget. The `status`/`error` fields leave a clean path to move long reviews onto a background queue without a data-model change.
- The landing page includes marketing elements from the design (pricing tiers, "Continue with GitHub"); these are presentational. Auth is email/password — the GitHub button surfaces a "not configured in this build" message rather than pretending to work.
