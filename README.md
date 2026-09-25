# Boggle

A shared Boggle board and 3-minute timer. Everyone who opens the page sees the same
board; pressing **Shuffle & Start New Round** deals a new one for all players via
Supabase Realtime. Write words on paper, and when time is up the app lists every
word (4+ letters) on the board.

## Development

```sh
npm ci
cp .env.example .env.local   # fill in your Supabase URL and anon key
npm run dev
```

Checks: `npm run lint`, `npm run typecheck`, `npm run build`.

## Deployment

It's a static site: `npm run build` produces `dist/`, which can be served by any
static host (Netlify, Vercel, Cloudflare Pages, GitHub Pages…).

1. Create a Supabase project and run `supabase/schema.sql` in its SQL editor.
2. Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in the host's build
   environment (they're baked in at build time).
3. Build command `npm run build`, publish directory `dist`.
