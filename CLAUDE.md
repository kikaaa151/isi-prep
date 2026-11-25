# ISI príprava – project context for Claude

Study app for the credit test (zápočtový test) of the TUKE FEI course **ISI – Inteligentné systémy v informatike**
(machine learning with scikit-learn + search, CSP and local search). The user is a student preparing for that test.

## The test the app simulates

100 points, 15 questions, 45 minutes. Multiple choice with **one or more** correct options; one wrong tick or one
missing correct tick = 0 points for the question. Theoretical and practical (code) questions. Sequential – no going
back. The goal: know the theory and be able to write the exercise codes from memory.

## Working with the user

- Reply in **Slovak**. UI text and all learner-facing content are Slovak with diacritics; code, comments,
  identifiers and docs (README, this file) are English.
- When the user asks to "learn", "explain" or "quiz me", teach from `content\` (theory, codes, questions) – it is
  the curated summary of the course. When they ask to change the app or the content, follow the rules below.

## Run and validate

Requirements: Python 3 with `markdown` (build); Node.js only for the tests. Optional for running the reference
codes: `numpy pandas scikit-learn matplotlib`.

```powershell
# one-time: the scripts expect a venv in the PARENT folder (..\.venv); plain `python` is the fallback
python -m venv ..\.venv
..\.venv\Scripts\python -m pip install markdown numpy pandas scikit-learn matplotlib

.\start.ps1                                   # build js\data.js, serve http://127.0.0.1:5173/, open browser
..\.venv\Scripts\python tools\build.py        # validate content + rebuild js\data.js
..\.venv\Scripts\python tools\build.py --check
node tools\test-logic.js                      # tests of js\logic.js (53 tests)
node tools\check-data.js                      # checks the built data.js against the logic
```

After any change: `build.py` must report 0 errors (1 known warning: Quizlet card `qz-13` has all options
correct – intentional), `node tools\test-logic.js` and `node tools\check-data.js` must pass, `node --check` on
changed JS files. For UI changes, load the app in a browser and click through the affected section.

## Architecture (details in README.md)

- Pure static app: `index.html` + `css\*.css` + `js\*.js`, vanilla ES2020, classic `<script>` tags. **No framework,
  bundler, ES modules, CDN or network requests** – it must keep working from `file://`.
- `js\logic.js` – pure logic (code diff for the from-memory mode, scoring, test composition, point split,
  practice scheduling), loadable by the browser and by Node. Put new pure logic here and test it in
  `tools\test-logic.js`.
- `js\store.js` – progress in `localStorage` under one versioned key `isi-prep:v1`. Changing its shape needs a
  migration, otherwise users lose progress.
- `js\app.js` (hash router, shell), `js\ui.js` (helpers), `js\views\*.js` (one file per section).
- `js\data.js` is **generated** by `tools\build.py` from `content\` – never edit it by hand.
- PWA for phones: `manifest.webmanifest`, `sw.js` (offline cache), `icons\`; deployed to GitHub Pages by
  `.github\workflows\pages.yml`. A new CSS/JS file must be added to `SHELL` in `sw.js` (and `CACHE` bumped).

## Content (`content\`)

The binding format is [content/README.md](content/README.md) – read it before touching content. In short:
`topics.json` (8 fixed topics t1–t8), `theory\<topicId>.md`, `weeks\w01..w10.md`, `codes\<topicId>\index.json` +
reference `.py` (key lines marked with a trailing `#!`), `questions\<topicId>.json` and `questions\quizlet.json`.
Paths like `D:\SKOLA\ISI\...` in that file are from the original machine – adapt them to the local checkout.

Rules that matter:
- Facts must come from the course materials (source priority: this year's Moodle weeks → Teams archive → lectures
  → last year's archive and Quizlet). Search/CSP/local search have no lecture slides – standard Russell & Norvig
  (AIMA) definitions are used there.
- Reference codes must actually run; practical questions state real outputs – verify by running code.
- Question ids are unique across all files; 4–6 options with at least one correct and one wrong (Quizlet cards
  are exempt and kept faithful to the cards; contradicting ones carry `"disputed": true`).

## Course materials (not in this folder)

The original machine has a sibling folder `..\materials\` with text extracted from the course (Moodle weeks 1–10
codes and notebooks, lecture slides `isi_01..04`, A*/Greedy pseudocode, DFS/BFS sheet, Teams archive, last
year's codes, `quizlet-flashcards.json`). If it is missing and the task needs the sources:
- Moodle course: https://moodle.kpi.fei.tuke.sk/course/view.php?id=120 (TUKE SSO login; the user must log in
  themselves – never type their credentials). The lecture PDFs are password-protected; ask the user for the
  password, do not try to bypass it.
- Teams: `General.zip` of the ISI team (codes of exercises 1–9, some `_sol` solutions, books).
- Quizlet: https://quizlet.com/990572431/isi-flash-cards/ (81 exam flashcards).
- Algorithm visualisation recommended by the teacher: https://qiao.github.io/PathFinding.js/visual/

Do not publish course materials or copy textbook PDFs into the project.

## Known caveats (tell the user when relevant)

- Solutions of weeks 7, 9, 10 and of all `_task` exercises are **not official** – they were completed along the
  comments in the student versions and the pseudocodes. Least certain: `_fc` (forward checking, Sudoku).
- The LCV in the teachers' Sudoku code counts neighbours that can *not* take the value (opposite of the
  textbook) – kept as in class, flagged in the content.
- The three Boston-dataset codes (`fetch_openml(name="boston")`) fail with pandas 3.x + scikit-learn 1.9
  (workaround `parser="liac-arff"` in the explanation of `w03-boston-features`).
- Test points (practical 8, theory 6) are an estimate; the real split of the 100 points is unknown.
