# Akshar

Create Handlebars templates, fill them in as "generations", and download them as PDFs.

## Features

- **Templates** — write Handlebars markup with `{{variables}}`, define the variables that fill them in, and preview live.
- **Assets** — upload images (stored on Maalgaadi) and insert them into templates.
- **Generations** — fill in a template's variables and save a rendered snapshot; download it as a PDF in A4, A5, Letter, or Legal format.
- Single shared password auth (no user accounts) via a signed, stateless cookie.

## Getting started

1. Copy `.env.example` to `.env` and fill in the values:
   - `PASSWORD` — the shared login password.
   - `DATABASE_URL` — Postgres connection string.
   - `NEXT_PUBLIC_MAALGAADI_ENDPOINT`, `NEXT_PUBLIC_MAALGAADI_API_ENDPOINT`, `MAALGAADI_API_KEY` — Maalgaadi file storage credentials (optional; the Assets page shows a setup notice until these are set).
2. Install dependencies:
   ```bash
   pnpm install
   ```
3. Install the Chromium browser used for PDF rendering (playwright-core does not bundle it):
   ```bash
   npx playwright install chromium
   ```
4. Run the dev server:
   ```bash
   pnpm dev
   ```

Open [http://localhost:3000](http://localhost:3000) to view the app.

## Database

This project does not run migrations automatically. Once a database is available, apply the schema with:

```bash
pnpm exec prisma migrate dev
```
