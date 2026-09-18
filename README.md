# Bookman

An AI writing assistant for novelists. Upload your story bible (background,
characters, world, timeline) as a Word document, review what the AI extracts
from it, and use it to get help predicting what happens next, exploring how a
character would act in a given situation, or drafting a chapter — grounded in
the setting you've established.

## How it works

- **Canon (story bible)**: a single set of structured entries per project —
  characters, world/setting, timeline, other — that the app treats as source
  of truth when generating anything.
- **Uploads**: `.docx` files are parsed and diffed against the current canon.
  The AI proposes new/updated entries; nothing is written to canon until you
  approve it on the **Diffs** page.
- **Chapters**: paste in the final text of a chapter you've written (this tool
  only outputs drafts — it doesn't edit your manuscript for you) and the app
  re-runs the same extraction against it, so canon stays in sync with what
  you've actually written, again subject to your review.
- **Draft / Predict**: three modes — predict what happens next, predict a
  character's behavior in a situation, or draft a full chapter — each grounded
  in the current canon plus your most recent chapters.

The app defaults to Chinese (可以在创建作品时切换语言) for prompts and chapter-length
framing (字数而非词数), since that's the primary writing language for this project.

## Stack

- Next.js 16 (App Router) + TypeScript + Tailwind CSS
- Prisma 7 + SQLite (`prisma/schema.prisma`, client generated into
  `src/generated/prisma` — gitignored, regenerated via the `postinstall`
  script)
- `openai` SDK (model `gpt-5.5`, via the Responses API) for extraction
  (structured output) and drafting (streaming)
- `mammoth` for `.docx` → plain text

There's no login system yet — every request acts as a single seeded user
(`src/lib/currentUser.ts`). The schema is already multi-tenant (everything is
scoped by `userId`/`projectId`), so adding real auth later is additive, not a
schema rewrite.

## Getting started

```bash
npm install
cp .env.example .env   # then fill in OPENAI_API_KEY
npm run db:migrate     # creates prisma/dev.db and applies migrations
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Environment variables

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | SQLite file path, e.g. `file:./prisma/dev.db` |
| `OPENAI_API_KEY` | OpenAI API key ([platform.openai.com](https://platform.openai.com)) |
| `DEFAULT_USER_EMAIL` | Optional; identifies the single local user record. Defaults to `writer@bookman.local`. |

## Project layout

```
prisma/schema.prisma          data model (User, Project, CanonEntry, Chapter, Upload, CanonDiff)
src/lib/openai.ts             OpenAI calls: canon extraction (structured output) + draft streaming
src/lib/docx.ts               .docx -> text
src/app/actions.ts            server actions (create project, canon CRUD, approve/reject diffs, save chapter)
src/app/api/.../upload        route handler: multipart upload -> parse -> extract -> diffs
src/app/api/.../draft         route handler: streams generated text back to the client
src/app/projects/[id]/...     pages: dashboard, canon, upload, diffs, chapters, draft
```

## Known gaps (intentionally out of scope for this first pass)

- No authentication — single local user.
- No pagination on canon/chapter lists (fine at the scale of one novel; would
  need it before "share with other writers").
- Canon diff review approves/rejects one at a time — no bulk actions.
