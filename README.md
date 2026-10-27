# Boggle

A Boggle timer and board for playing with pen and paper, synced live between everyone who has the page open.

- **Shuffle & start** rolls the 16 classic dice and starts the clock for every connected player; pause/resume is shared too (Space toggles it).
- When time is up the board hides; show it again, check the words from your list, and browse every word on the board with its score (official scoring, 3+ letters, "Qu" counts as two). Tap a word to trace it on the board.
- Works offline on a single device when the realtime server is unreachable.

## Development

```sh
npm install
npm run dev        # start the app
npm test           # unit tests
npm run lint
npm run build      # typecheck + production build
```

Realtime sync uses Supabase (broadcast + presence on the `boggle_board` channel; the last board is saved to the `boggle_board` table, row `id = 1`). Override the project with `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY`, or set both to empty strings to disable sync.

The word list (`public/dictionary.txt`) is built from [SCOWL](http://wordlist.aspell.net/) (size 60, English/American/British) by `npm run build:dictionary`; see `public/dictionary-LICENSE.txt`.
