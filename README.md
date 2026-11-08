# Ohmie — Your Tiny Companion

Ohmie is a black-and-white retro pixel-art virtual companion featuring a React frontend, an Express API, Supabase Auth/PostgreSQL, and Supabase Realtime synchronization.

---

## Live Deployments & Repository

- **Live Production App (Vercel):** [https://ohmie-liart.vercel.app](https://ohmie-liart.vercel.app)
- **Alternate Production Mirror:** [https://ohmie-vishnugoooo4-1455s-projects.vercel.app](https://ohmie-vishnugoooo4-1455s-projects.vercel.app)
- **GitHub Repository:** [https://github.com/vishnua-dev06/ohmie](https://github.com/vishnua-dev06/ohmie)

---

## Character & Pixel Art Design

Ohmie is rendered using chunky square pixels and a restrained black, white, and gray palette:

- **Body:** Friendly lightbulb-shaped glass head, threaded metal screw base with horizontal stripe banding, and cute stubby feet.
- **Safety Helmet:** White engineer hard hat with bold black pixel outlines, segment seams, visor brim, and a prominent centered **lightning-bolt emblem** (`⚡`).
- **Nine Distinct Expressions:**
  - **Happy:** Arched eyes (`^ ^`), open smiling D-mouth, cheek blush pixels, floating pixel heart, radiant rays, and raised celebration arms.
  - **Sad:** Glossy watery eyes with dual gleams, streaming tears, downturned mouth, dark scribble gloom cloud, and stress marks.
  - **Angry:** Sharp furrowed V-brows, grimace/shouting mouth, steam puffs on both sides, anger vein mark (`💢`), and clenched fists.
  - **Surprised:** Giant anime starry watery eyes with dual highlights, round `'O'` mouth, alert rays, double exclamation marks (`!!`), and hands up to cheeks.
  - **Sleeping:** Peaceful curved closed eyes, calm mouth, folded hands, and floating pixel `'Zzz'`.
  - **Excited:** Four-pointed star sparkle eyes (`★ ★`), wide open laugh, floating starbursts, and arms raised high.
  - **Tired:** Heavy droopy eyelids, wavy sigh mouth, drooping arms, and an anime sweat drop.
  - **Lonely:** Big wistful eyes looking down/to the side, quiet timid mouth, and a solitary floor speck.
  - **Curious:** Asymmetrical quizzical brows, one wide eye and one squinting, one-sided smirk, hand on helmet, and a floating pixel question mark (`?`).

All character illustrations use `shape-rendering="crispEdges"` and `image-rendering: pixelated` to guarantee razor-sharp square pixels without gradients, blurs, or smoothing at any scale.

---

## Run Locally

### Requirements
- Node.js 20.19+ (Node 24 recommended)
- npm

### 1. Install dependencies
```sh
npm install
```

### 2. Configure environment (Optional for preview mode)
- Copy `apps/web/.env.example` to `apps/web/.env`
- Copy `apps/api/.env.example` to `apps/api/.env`

*(Without Supabase credentials, Ohmie runs in interactive **preview mode**, storing local pet interactions, tasks, and moods in browser storage.)*

### 3. Start development servers
```sh
npm run dev
```

- **Web Client (Vite):** [http://localhost:5173](http://localhost:5173)
- **API Server (Express):** [http://localhost:8787](http://localhost:8787)
  - API Health Check: [http://localhost:8787/api/health](http://localhost:8787/api/health)

---

## Environment Variables

### Web (`apps/web/.env`)
| Variable | Purpose |
| --- | --- |
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Public Supabase anon key; RLS still applies |
| `VITE_API_BASE_URL` | Express API origin (defaults to `http://localhost:8787`) |

### API (`apps/api/.env`)
| Variable | Purpose |
| --- | --- |
| `PORT` | API port (defaults to `8787`) |
| `WEB_ORIGIN` | Allowed web origin(s), comma-separated in production |
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_ANON_KEY` | Public key for reference/configuration |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only Supabase service-role key |
| `OPENAI_API_KEY` | Optional server-side OpenAI key for AI companion chat |
| `OPENAI_MODEL` | Optional model name (defaults to `gpt-4o-mini`) |

---

## Supabase Database Setup

To enable multi-user circles and shared pet synchronization:

```sh
supabase start
supabase db reset
```

Or apply `supabase/migrations/202611080001_initial_ohmie.sql` in your hosted Supabase SQL editor. The schema includes:
- Profiles, shared pets, circle memberships, and hashed expiring invitations
- Realtime pet state and activity pub/sub
- Row-Level Security (RLS) policies ensuring personal tasks, mood journals, and private chats are accessible only to their creator
- Transaction-safe pet action RPC functions with row locking and idempotent action IDs

---

## Quality & Test Checks

```sh
npm run typecheck    # TypeScript verification across web and api workspaces
npm test             # Vitest component tests & API security tests
npm run build        # Production builds for Vite client and Express API
```

---

## Deployment Configuration

- **Vercel (Web):**
  - Configured in `vercel.json` with SPA routing rewrites (`/(.*) -> /index.html`) and output directory `apps/web/dist`.
  - Continuous deployment is enabled on branch `main`. Any push to GitHub automatically triggers a new production build.
- **Render (API):**
  - Defined in `render.yaml` for the Express service in `apps/api`.
