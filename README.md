# Sift — AI-Powered Code Review Assistant

Sift lets developers upload a codebase (ZIP, drag-and-drop folder, or a public GitHub URL) and receive structured, AI-generated code reviews — **Summary → Issues → Recommendations**, each issue ranked by severity. It runs against **any OpenAI-compatible model**: OpenAI, LM Studio, Ollama, OpenRouter, or any custom endpoint. Provider configuration is per-account and never hardcoded.

It also includes a **Code Explorer** (file tree + syntax-highlighted previews), **review history with search**, and **Chat with Code** — ask questions in plain English and get answers grounded in the uploaded files.

> **Stack:** Next.js + TypeScript + Tailwind (frontend) · NestJS + MongoDB/Mongoose (backend) · OpenAI-compatible AI integration.
> The UI implements the provided **Sift** design (`design/Sift.dc.html`) — dark, developer-focused, Geist + Bricolage Grotesque type, purple accent.

---

## Features

| Area | What it does |
| --- | --- |
| **Authentication** | Email/password register, login, logout. JWT-based, protected routes on both client and server. |
| **Projects** | Create, list, open, and delete projects (name, description, creation date). Deleting cascades to files, reviews, and chats. |
| **Code Upload** | Three ingestion paths: **ZIP** upload, **drag-and-drop** files/folders, and **public GitHub URL** import. Binaries and noise (`node_modules`, `.git`, build output) are skipped automatically. |
| **Code Explorer** | Folder-hierarchy tree, file preview, syntax highlighting (highlight.js with a theme matching the design). |
| **AI Review Engine** | Review a single file, multiple files, or the entire project. Output: summary, detected issues (with file/line + suggested fix), recommendations, and a per-severity breakdown (Critical/High/Medium/Low). |
| **Review Templates** | Three modes: **Security**, **Performance**, **Code Quality** — each with a tailored prompt and focus areas. |
| **Review History** | Stores every review; searchable by project, mode, scope, or summary. Open any review to see its details. |
| **Chat with Code** | Ask questions about a project; simple keyword-overlap retrieval selects the most relevant files as context and the answer cites them. |
| **AI Providers** | Configure Base URL, API key (encrypted at rest), and model name. Presets for OpenAI / LM Studio / Ollama / OpenRouter. "Test connection" verifies reachability. |

See [`ARCHITECTURE.md`](./ARCHITECTURE.md) for design and data-flow details, and [`AI_USAGE.md`](./AI_USAGE.md) for the mandatory AI-usage disclosure.

---

## Repository structure

```
sift/
├── frontend/          # Next.js 14 (App Router) + TypeScript + Tailwind
├── backend/           # NestJS + Mongoose
├── design/            # Sift.dc.html — the source design that the UI implements
├── docker-compose.yml # Local MongoDB
├── README.md
├── ARCHITECTURE.md
└── AI_USAGE.md
```

---

## Prerequisites

- **Node.js 20+** (developed on Node 22) and npm 10+
- **MongoDB** — either Docker (recommended) or a MongoDB Atlas connection string

---

## Setup

### 1. Start MongoDB

With Docker (recommended):

```bash
docker compose up -d        # starts MongoDB on localhost:27017
```

Or use MongoDB Atlas and put its connection string in `backend/.env` (next step).

### 2. Backend

```bash
cd backend
cp .env.example .env        # then edit values (see "Environment variables" below)
npm install
npm run start:dev           # http://localhost:4000/api
```

Generate real secrets before running:

```bash
# JWT secret
openssl rand -base64 48
# 32-byte encryption key for provider API keys
openssl rand -hex 32
```

### 3. Frontend

```bash
cd frontend
cp .env.local.example .env.local   # NEXT_PUBLIC_API_URL=http://localhost:4000/api
npm install
npm run dev                        # http://localhost:3000
```

### 4. First run

1. Open `http://localhost:3000`, click **Get started**, and register an account.
2. Go to **Settings** and add an AI provider:
   - **OpenAI** → Base URL `https://api.openai.com/v1`, your API key, model e.g. `gpt-4o`
   - **LM Studio** → `http://localhost:1234/v1` (no key), your loaded model
   - **Ollama** → `http://localhost:11434/v1` (no key), e.g. `llama3.1`
   - Click **Test connection** to verify.
3. Create a project, upload code (ZIP / folder / GitHub URL), open **Code Explorer**, then **AI Review** → pick a mode → **Run review**.

---

## Environment variables

### Backend (`backend/.env`)

| Variable | Description | Default |
| --- | --- | --- |
| `PORT` | API port | `4000` |
| `CORS_ORIGIN` | Comma-separated allowed origins (the frontend) | `http://localhost:3000` |
| `MONGODB_URI` | MongoDB connection string | `mongodb://localhost:27017/sift` |
| `JWT_SECRET` | Secret for signing JWTs | _(required — set a long random value)_ |
| `JWT_EXPIRES_IN` | Token lifetime | `7d` |
| `ENCRYPTION_KEY` | Key used to encrypt stored provider API keys (AES-256-GCM) | _(required — set a random value)_ |
| `MAX_UPLOAD_BYTES` | Max upload size | `26214400` (25 MB) |
| `FRONTEND_URL` | Where OAuth redirects the browser back to | `http://localhost:3000` |
| `GITHUB_CLIENT_ID` | GitHub OAuth App client id (optional) | _(empty — GitHub login disabled)_ |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth App client secret (optional) | _(empty)_ |
| `GITHUB_CALLBACK_URL` | OAuth callback URL | `http://localhost:4000/api/auth/github/callback` |
| `DEFAULT_AI_BASE_URL` | Optional `.env` default provider — base URL | _(empty)_ |
| `DEFAULT_AI_API_KEY` | Optional `.env` default provider — key | _(empty)_ |
| `DEFAULT_AI_MODEL` | Optional `.env` default provider — model name | _(empty)_ |
| `DEFAULT_AI_NAME` | Optional display name for the `.env` default | `Environment default` |

#### AI provider configuration (UI + optional `.env` default)

Providers are configured **per user in Settings** (Base URL, API key, model) — this is the primary, required mechanism and supports OpenAI, LM Studio, Ollama, OpenRouter, or any OpenAI-compatible endpoint.

As a convenience for self-hosting, you may also set a **default provider in `.env`** via `DEFAULT_AI_*`. Resolution order when running a review/chat is: explicitly chosen provider → your default UI provider → the `.env` default. So you can set one model in `.env` and never open Settings, while UI providers still take precedence.

**Using Ollama (local):** install [Ollama](https://ollama.com), `ollama pull qwen2.5-coder:7b`, then either add it in Settings or set:
```
DEFAULT_AI_NAME=Ollama (local)
DEFAULT_AI_BASE_URL=http://localhost:11434/v1
DEFAULT_AI_API_KEY=
DEFAULT_AI_MODEL=qwen2.5-coder:7b
```
**Using Ollama Cloud (free tier, no download):** run big hosted models without a GPU. The simplest path uses your **local** Ollama as a proxy:
1. `ollama signin` (free account at [ollama.com](https://ollama.com)).
2. Use base URL `http://localhost:11434/v1` (no API key) and a `*-cloud` model name. Free-tier coding models include **`qwen3-coder:480b-cloud`** (excellent for review) and `gpt-oss:120b-cloud` / `gpt-oss:20b-cloud`. Premium models (`kimi-*`, `glm-*`, `deepseek-v3.1:*`) require a paid Ollama subscription.

Example `.env` (what this project ships configured to):
```
DEFAULT_AI_NAME=Ollama Cloud (qwen3-coder)
DEFAULT_AI_BASE_URL=http://localhost:11434/v1
DEFAULT_AI_API_KEY=
DEFAULT_AI_MODEL=qwen3-coder:480b-cloud
```
Alternatively, hit Ollama Cloud directly with base URL `https://ollama.com/v1` + an API key. Other clouds work the same way (OpenAI `https://api.openai.com/v1`, OpenRouter `https://openrouter.ai/api/v1`).

#### Optional: "Continue with GitHub"

Email/password works out of the box. To also enable GitHub login:

1. Go to **https://github.com/settings/developers → OAuth Apps → New OAuth App**.
2. Set **Homepage URL** = `http://localhost:3000` and **Authorization callback URL** = `http://localhost:4000/api/auth/github/callback`, then **Register application**.
3. Copy the **Client ID**, click **Generate a new client secret**, and copy that too.
4. Put both in `backend/.env` (`GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`) and restart the backend.

Until those are set, the button shows a friendly "not configured" message instead of breaking.

### Frontend (`frontend/.env.local`)

| Variable | Description | Default |
| --- | --- | --- |
| `NEXT_PUBLIC_API_URL` | Base URL of the backend API (include `/api`) | `http://localhost:4000/api` |

> **Security:** never commit `.env` files or API keys. Provider API keys are encrypted at rest in MongoDB and are only decrypted server-side at request time — they are never returned to the browser.

---

## Database setup

No manual schema migration is required — Mongoose creates collections and indexes on first use. Collections: `users`, `projects`, `codefiles`, `reviews`, `aiproviders`, `chatsessions`, `chatmessages`. See [`ARCHITECTURE.md`](./ARCHITECTURE.md#database-design) for the data model.

To reset local data: `docker compose down -v` (removes the Mongo volume).

---

## Available scripts

**Backend** (`/backend`): `npm run start:dev` (watch), `npm run build`, `npm run start:prod`, `npm run lint`
**Frontend** (`/frontend`): `npm run dev`, `npm run build`, `npm run start`, `npm run lint`

---

## Architecture overview

- **Frontend** — Next.js App Router. A public marketing/landing page and auth page, then a protected app shell (sidebar) covering Projects, Code Explorer, AI Review, History, Chat, and Settings. A typed `fetch` client attaches the JWT and centralizes error handling.
- **Backend** — NestJS organized into feature modules (`auth`, `users`, `projects`, `files`, `reviews`, `providers`, `chat`, `ai`). Mongoose models per feature; a single `AiClientService` wraps the OpenAI SDK and talks to whichever provider the user configured.
- **AI integration** — The review engine builds a mode-specific system prompt, packs the selected files into a context budget, requests a strict-JSON response, parses and persists it with computed severity counts. Chat uses lightweight keyword retrieval to ground answers.

Full details in [`ARCHITECTURE.md`](./ARCHITECTURE.md).
