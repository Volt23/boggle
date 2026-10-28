# Boggle

A Boggle timer and board for playing with pen and paper. No accounts, no server: everything runs in the browser.

- **Shuffle & start** rolls the 16 classic dice and starts the clock. Space pauses and resumes; the board blurs while paused.
- **Play together**: every board has a 5-character code (shown top right, and in the page link). Everyone who enters the same code, or opens the same link, gets the same board. Count down and press start together.
- When time is up the board hides; show it again, check the words from your list, and browse every word on the board with its score (official scoring, 3+ letters, "Qu" counts as two). Tap a word to trace it on the board.

## Development

```sh
npm install
npm run dev        # start the app
npm test           # unit tests
npm run lint
npm run build      # typecheck + production build (static files in dist/)
```

The build is a static site: host `dist/` anywhere.

The word list (`public/dictionary.txt`) is built from [SCOWL](http://wordlist.aspell.net/) (size 60, English/American/British) by `npm run build:dictionary`; see `public/dictionary-LICENSE.txt`.
