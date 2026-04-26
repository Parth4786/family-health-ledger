# Family Health Ledger

Family Health Ledger is a React + TypeScript PWA for elder-care medicine tracking, refill prediction, report storage, and monthly cost visibility. It is designed to run as a static site on GitHub Pages while syncing shared household data through Supabase.

## What is implemented

- Shared household auth with Supabase email/password
- Patient registry
- Medicine inventory with refill prediction
- Purchase logging for stock and cost tracking
- Report archive with optional file upload to Supabase Storage
- IndexedDB cache with offline queue and later sync
- Mobile-friendly PWA shell
- GitHub Pages deployment workflow

## Local development

```bash
npm install
npm run dev
```

Optional `.env.local`:

```bash
VITE_SUPABASE_URL=https://nufhfyyjkhshmkbmwwxh.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

If you do not set env vars, the app falls back to the Supabase project URL you provided. The anon key is public by design, but access stays protected by Supabase Auth + RLS.

## Supabase setup

1. In Supabase, enable Email auth.
2. Open SQL Editor and run [supabase/schema.sql](./supabase/schema.sql).
3. Confirm the `reports` bucket exists.
4. Create your first household account from the app UI.

## GitHub Pages deployment

1. Push this repo to GitHub.
2. In GitHub repository settings, set Pages source to `GitHub Actions`.
3. Push to `main`. The workflow in [.github/workflows/deploy.yml](./.github/workflows/deploy.yml) builds and deploys automatically.

## Notes

- OCR is not implemented in this first release because handwritten prescription OCR would be misleadingly unreliable. The current product keeps manual entry primary.
- Deletes are handled as soft archive actions to preserve sync safety and auditability.
