# Ohmie

Ohmie is a grayscale virtual companion with a React client, an Express API, Supabase Auth/PostgreSQL, and Supabase Realtime. The project folder started empty, so this repository is a new implementation scaffold based on the supplied Ohmie prompt and the two attached visual references.

## Run locally

Requirements: Node.js 20.19+ (Node 24 is recommended) and npm. To use real accounts and shared pets, install the [Supabase CLI](https://supabase.com/docs/guides/cli) and create a Supabase project.

1. Install packages from the project root:

   ```sh
   npm install
   ```

2. Copy `apps/web/.env.example` to `apps/web/.env` and `apps/api/.env.example` to `apps/api/.env`.
3. Set the Supabase project URL and public anon key in the web environment. Set the same URL, the anon key, and the **server-only** service-role key in the API environment. Never put the service-role key in a `VITE_` variable.
4. Optionally set `OPENAI_API_KEY` and `OPENAI_MODEL` in `apps/api/.env` to enable server-side AI replies.
5. Start the Vite client and API together:

   ```sh
   npm run dev
   ```

The web client runs at `http://localhost:5173`; the API runs at `http://localhost:8787`. Without Supabase credentials, Ohmie opens in clearly labeled preview mode. Preview pet actions are local to that browser, tasks and mood entries are temporary, and chat replies are examples rather than AI. Preview mode does not create or synchronize a shared pet.

## Supabase setup

For a hosted Supabase project, apply `supabase/migrations/202611080001_initial_ohmie.sql` using the CLI or SQL editor. For a local Supabase stack:

```sh
supabase start
supabase db reset
```

The migration creates profiles, shared pets, members, hashed invitations, activities, once-per-UTC-day shared rewards, private tasks, private moods, chat history, achievements, indexes, RLS policies, and transaction-safe pet RPC functions. It also adds pet state and activity tables to the Realtime publication. The backend uses the service-role key only after it validates each Supabase access token and checks pet membership.

In Supabase Auth settings, set the site URL and allowed redirect URL to your deployed web origin. Email confirmation is enabled in the local Supabase config; configure your production email provider before inviting real users.

## Environment variables

### Web (`apps/web/.env`)

| Variable | Purpose |
| --- | --- |
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Public Supabase anon key; RLS still applies |
| `VITE_API_BASE_URL` | Express API origin, such as `http://localhost:8787` |

### API (`apps/api/.env`)

| Variable | Purpose |
| --- | --- |
| `PORT` | API port; defaults to `8787` |
| `WEB_ORIGIN` | Allowed web origin(s), comma-separated in production |
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_ANON_KEY` | Public key for reference/configuration |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only Supabase key; never expose to the browser |
| `OPENAI_API_KEY` | Optional server-side OpenAI key |
| `OPENAI_MODEL` | Optional model name; defaults to `gpt-4o-mini` |

No credentials or deployment URLs are included in this project.

## Features in this scaffold

- Auth dialog with email registration, sign-in, sign-out, and password reset/update flow.
- Home dashboard with one reusable Ohmie SVG character, nine expressions, animated reactions, meters, tasks, and activity.
- Task creation, editing, completion, deletion, deadlines, priorities, and a weekly completion view.
- Private mood check-ins and journal notes, with recent mood visualization.
- AI chat through the API; when OpenAI is not configured, it says so and uses a labeled preview response.
- Pet interaction, memory matching, energy catcher, and a shared daily reward.
- Invitation links/codes, member list, owner role changes, member removal, and leaving a pet.
- PostgreSQL-backed concurrency control: pet-row locking, server timestamps, unique action IDs, and duplicate prevention.
- Realtime pet updates and shared activity; reconnecting clients reload canonical pet state.
- Browser reminders for task deadlines, daily check-ins, and shared activity after notification permission is granted. Reminders run while the app is open; this scaffold does not include background push delivery.
- Architecture page, grayscale light/dark settings, responsive layout, and accessible labels.

Personal tasks, journal text, and chat history are scoped to the authenticated user. The mood journal is never included in shared pet data. Offline pet actions are not presented as synced and are not queued; retry after reconnecting. The shared database remains the source of truth.

## Checks

```sh
npm run typecheck
npm run build
npm test
npx playwright install chromium
npm run test:e2e
```

The automated suite covers the nine Ohmie states, a dashboard pet action, invitation-code hashing/generation, dashboard navigation, and a narrow-screen navigation check. Running the two-physical-device scenario still requires configured Supabase credentials and two real user accounts. Once configured, create a pet on one account, join from a second browser/device, then feed/play on alternating devices and confirm both the pet row and activity timeline update. Also verify that a non-member receives `403` and cannot read the private task, mood, or chat tables through the anon key.

## Deployment

- **Web:** Vercel can build from the repository root using `vercel.json`. Set `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, and `VITE_API_BASE_URL` in the Vercel project.
- **API:** `render.yaml` defines an Express service rooted at `apps/api`. Set `WEB_ORIGIN`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, and optional `OPENAI_API_KEY`/`OPENAI_MODEL` in Render. Set `VITE_API_BASE_URL` in Vercel to the deployed API origin.
- **Database/Auth:** apply the migration to Supabase and configure the production Auth redirect URLs and email provider.

Before opening the app to users, configure credentials, apply the migration, run the two-account synchronization/security check, and complete the host-specific domain and email setup.
