# ISI príprava

Static web app that prepares for the credit test of the course *ISI – Inteligentné systémy v informatike*:
15 questions, 45 minutes, 100 points, multiple choice with one or more correct options (one wrong or missing
tick = 0 points for the question), sequential without going back. The UI is Slovak.

No framework, no bundler, no network requests: `index.html` + `css/*.css` + `js/*.js`.

## Run

```powershell
.\start.ps1              # builds js\data.js, serves http://127.0.0.1:5173/ and opens the browser
.\start.ps1 -Port 8080   # another port; -NoBrowser only serves
```

`start.ps1` uses `..\.venv\Scripts\python.exe` (falls back to `python`); the build needs the `markdown` package.
The app also works when `index.html` is opened directly (`file://`) once `js\data.js` exists.

Progress lives in the browser's `localStorage` under the single key `isi-prep:v1`. It is bound to the address:
`http://127.0.0.1:5173`, another port and `file://` each have their own progress – move it with
*Nastavenia → Exportovať / Importovať*.

## Phone (iOS / Android)

The app is a PWA (`manifest.webmanifest`, `sw.js`, `icons/`): served over HTTPS it can be added to the home
screen and then runs full-screen and offline. Hosting on GitHub Pages:

1. Create a GitHub repository from **this folder only** (never push `materials\`, it is git-ignored) and push it to `main`.
   A public repository makes the site public; Pages for private repositories need a paid plan.
2. *Settings → Pages → Build and deployment → Source: GitHub Actions*. The workflow
   `.github/workflows/pages.yml` rebuilds `js/data.js` and publishes on every push to `main`.
3. Open `https://<user>.github.io/<repo>/` on the phone:
   - **iPhone (Safari):** Share → *Add to Home Screen*.
   - **Android (Chrome):** menu ⋮ → *Install app* / *Add to Home screen*.

The service worker fetches from the network first and falls back to the cache (also after 4 s on a slow
connection), so new content shows up on the next start. On iOS the home-screen app has its own storage, separate
from Safari – move progress with export / import. When a file is added to the app, add it to `SHELL` in `sw.js`
and bump `CACHE`.

## Sections

| Section | What it does |
|---|---|
| Prehľad | Progress per topic (theory read, codes mastered, question accuracy), last tests with a trend, weakest topics and questions, quick actions. |
| Test | Simulation of the test: 10 theory + 5 practical questions spread over the topics, points 6 / 8 (weights 3 : 4, sum exactly 100), countdown with a warning at 5:00 and auto-submit, no way back, survives a reload. Result with breakdowns, full review and "Precvičiť chybné". The last 30 attempts are kept. |
| Otázky | Practice with immediate feedback; filters topic / week / type / source / state; unseen and recently wrong questions come first. |
| Teória | Theory per topic with a table of contents, "prečítané" mark, full-text search (ignores diacritics), printable cram sheet "Ťahák". |
| Kódy | Code exercises in three modes: *Čítať* (reference with key lines), *Doplniť* (type the key lines), *Naspamäť* (write the whole code; line diff against the reference, hints, score; mastered at ≥ 90 % without hints). |
| Týždne | Weeks 1–10: summary, the week's code exercises and questions. |
| Nastavenia | Theme (auto / light / dark), export, import and reset of the progress. |

Keyboard: in Test and Otázky `1`–`6` toggle the options and `Enter` confirms. In the code editor `Tab` /
`Shift+Tab` indent, `Enter` keeps the indentation (one level more after `:`), `Ctrl+Enter` checks, `Esc` then
`Tab` leaves the editor.

## Content

Everything shown comes from `content\` – the format is defined in [content/README.md](content/README.md)
(`topics.json`, `theory\<topicId>.md`, `weeks\wNN.md`, `codes\<topicId>\index.json` + `.py`, `questions\*.json`).
After editing the content rebuild the generated `js\data.js` (never edit it by hand):

```powershell
..\.venv\Scripts\python.exe tools\build.py            # validate + write js\data.js
..\.venv\Scripts\python.exe tools\build.py --check    # validate only
```

Options: `--content <dir>`, `--out <file>`, `--check`, `--lenient` (write the output even with errors, leaving
the invalid items out). Errors name the file and the id and give exit code 1; missing parts (a topic without
theory, codes or questions, a week without a summary, unmarked key lines, long code, fewer than 4 options) are
warnings, so the app works with partial content. Quizlet cards (`"source": "quizlet"`) are kept faithful to
their source: an unusual option count and a card whose options are all correct only warn.

## Code layout

| Path | Content |
|---|---|
| `js/logic.js` | Pure logic, shared by the browser (`ISILogic`) and Node: Python tokenizer and highlighter, code normalisation and line diff, scoring, test composition, point distribution, practice scheduling, search. |
| `js/store.js` | Progress in `localStorage` (one versioned key), export / import. |
| `js/ui.js`, `js/app.js` | DOM helpers and shared components; hash router, navigation, theme, test clock. |
| `js/views/*.js` | One file per section. |
| `js/boot.js` | Sets the theme before the first paint. |
| `css/studio.css` | Study studio theme: desktop sidebar, mobile navigation, reading and exercise layouts, light/dark tokens. Loaded after the shared styles. Uses local Bahnschrift / Georgia typography and inline SVG icons; no external assets. |
| `js/data.js` | **Generated** content bundle (`window.ISI_DATA`). |
| `manifest.webmanifest`, `sw.js`, `icons/` | Installable app on phones and offline cache (registered only over http/https). |
| `.github/workflows/pages.yml` | Build and deploy to GitHub Pages. |
| `tools/build.py` | Content validation and build. |
| `tools/test-logic.js` | Tests of `js/logic.js` – `node tools\test-logic.js`. |
| `tools/check-data.js` | Checks the built `js/data.js` against the logic (every reference code matches itself, tests can be composed, …) – `node tools\check-data.js`. |
| `tools/fixture-content/` | Tiny fictional content set for development: `python tools\build.py --content tools\fixture-content --out <file>`. |

How the from-memory check compares code: comments, blank lines and docstrings are dropped; statements wrapped
over several lines are joined; quote characters, spacing, trailing commas and the indentation *width* are
ignored, the indentation *level* is kept. Lines are aligned with an LCS diff; unmatched lines with token
similarity ≥ 0.7 are shown as near matches. Score = share of matched reference lines, key lines count double;
a correct line in the wrong place counts half (imports in any order count fully).
