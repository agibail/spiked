# Nightlife Safety Map — NYC prototype

A beginner-friendly React/Vite + Supabase starter. The visual map is centered on NYC.
It shows only rows in `public_reports`; submitted reports go to a separate private
`report_submissions` table and do not automatically become public.

## 1. Requirements

- Node.js (current LTS)
- A Supabase project
- An internet connection for map tiles and package installation

## 2. Run locally

In a terminal, inside this folder:

```bash
npm install
cp .env.example .env.local
```

Open `.env.local` and fill in:
- `VITE_SUPABASE_URL`: Project URL from Supabase project settings
- `VITE_SUPABASE_PUBLISHABLE_KEY`: publishable key (or legacy anon key) from API settings

Never put a Supabase `service_role` key or secret key in a `VITE_` variable or browser code.

Then run:

```bash
npm run dev
```

Open the local URL Vite prints, usually `http://localhost:5173`.

## 3. Set up the database

1. In Supabase, open SQL Editor.
2. Paste and run `supabase/schema.sql`.
3. Open Table Editor and confirm `report_submissions` and `public_reports` exist.
4. In project API settings, make sure the Data API is enabled for these tables.

The SQL uses Row Level Security and least-privilege grants:
- Visitors can INSERT a pending submission.
- Visitors cannot SELECT private submissions.
- Visitors can SELECT approved/sanitized rows from `public_reports`.
- Visitors cannot publish, edit, or delete public rows through the browser.

## 4. Test the moderation flow

1. Submit a test report in the website.
2. In Supabase Table Editor, open `report_submissions`. The new row should have status `pending`.
3. It should NOT appear on the public map.
4. Review the content and decide whether it is appropriate to publish.
5. If approved, manually add a new row to `public_reports` using a neutral venue label, month, approximate venue coordinates, and a short neutral summary. Do not copy identifying details from the private submission.
6. The public map will show that row after refresh.

Do not treat the manual copy step as verification of an allegation. Public labels must say that they are community reports and not independently verified. Have a documented process for reports that should be rejected, corrected, or removed.

## 5. Important limitations before any public launch

This is a prototype, not a fully hardened production service. A public launch should add:

- Server-side rate limiting / bot protection (for example, a carefully configured CAPTCHA or edge function).
- A private, authenticated moderator workflow with audit logs and least-privilege access.
- A privacy policy, data retention/deletion schedule, and contact for correction/removal requests.
- Moderation rules to remove names, personal identifying details, threats, and unsupported claims about individuals.
- A way to challenge or correct a listing and a process to handle malicious submissions.
- Careful review of location precision. Only show approximate venue-level locations; never expose a reporter's home, live location, or movement history.
- Tests confirming RLS grants and policies, and review by someone experienced in web security and applicable law.

Anonymous submissions are not the same as guaranteed anonymity: infrastructure providers may retain technical logs. Do not promise complete anonymity without auditing the full deployment and its logging settings.

The SQL bounds latitude/longitude to a rough NYC area; adjust deliberately if coverage changes. The public table is separate from the private submissions table so the browser never receives pending narrative details.

## 6. Useful documentation

- Vite: https://vite.dev/guide/
- Supabase Row Level Security: https://supabase.com/docs/guides/database/postgres/row-level-security
- Supabase data security: https://supabase.com/docs/guides/database/secure-data
