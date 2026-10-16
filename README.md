# VimQuest

VimQuest is a keyboard-first Vim learning game for developers who use VS Code. It uses Angular signals, Monaco Editor, and Monaco Vim to teach real modal editing through playable challenges rather than static command cards.

## Run locally

```bash
npm install
npm start
```

Open `http://localhost:4200`.

## Verify

```bash
npm run build
npm test -- --watch=false
npm run test:e2e
```

The browser suite starts its own development server when one is not already running. If Playwright's browser is not installed yet, run `npx playwright install chromium` once.

## Included

- Ninety playable lessons across nine progressively unlocked chapters
- Monaco Editor with Monaco Vim modes, motions, operators, search, text objects, undo, paste, Visual mode, and counts
- Cursor, content, mode, selection, command, and combined challenge validation
- Arrow/mouse bypass detection for guided motion lessons and paste blocking for scored challenges
- Live mode, keystroke, command-construction, timer, feedback, hint, star, and XP displays
- Campaign, focused practice, speedrun, Vim Golf, and deterministic local-date daily modes
- Versioned LocalStorage persistence for progress, settings, streaks, bests, achievements, and mastery
- Dashboard, learning path, statistics, settings, and responsive navigation
- Unit and browser-level tests for the core gameplay and persistence paths

## Integration notes

- Monaco Vim provides real Vim behavior, but browser/Monaco support is not identical to native Vim or VSCodeVim. Visual Block is exposed only to the extent supported by Monaco Vim.
- VS Code workbench actions such as changing tabs, editor groups, and opening the command palette are taught as VS Code shortcuts or configurable mappings; VimQuest does not pretend these are native Vim defaults.
- Reference solutions are verified efficient solutions, not claims of global optimality.
