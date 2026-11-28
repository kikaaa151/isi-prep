# Content format

Everything the app shows comes from this folder. `tools/build.py` validates it and bundles it into the generated
`js/data.js` (`window.ISI_DATA`). Never edit `js/data.js` by hand.

All learner-facing text is **Slovak with diacritics** (UTF-8, no BOM). Code, identifiers and file names are ASCII.

## Source priority

1. This year's Moodle weeks 1–10 (`materials/moodle/wNN`) and their activities – **the primary source**.
2. This year's Teams archive (`materials/teams/cv_NN`, includes some `_sol` solutions).
3. Lectures (`materials/text/isi_01..04.txt`), `pseudocodes.txt`, `exercise_07_dfs_and_bfs.txt`.
4. Last year's archive (`materials/archive-last-year`) and the Quizlet cards – supplements only.

## `topics.json`

Fixed list of topics: `id`, `order`, `weeks`, `title`. Topic ids are referenced everywhere else. Do not add topics.

## `theory/<topicId>.md`

One Markdown file per topic: the summarised theory a student must know for the test.

- Starts with `# <title>`; sections use `##`, sub-sections `###`.
- Allowed: paragraphs, bullet/numbered lists, **bold**, *italic*, `inline code`, fenced code blocks
  (```` ```python ````), tables, links, blockquotes (`>` – used for "Pozor" / "Na teste" call-outs).
- No images, no raw HTML, no LaTeX – write formulas in plain text / Unicode (`h(n) ≤ h*(n)`, `x' = (x − μ) / σ`).
- Dense and exam-oriented: definitions, properties, comparisons in tables, typical traps. Not an essay.
- End with a `## Rýchle zhrnutie` section: 8–15 one-line bullets to re-read right before the test.

## `weeks/wNN.md` (`w01` … `w10`)

Simple summary of one Moodle week, same Markdown rules:

- `# <N>. týždeň – <short name>`
- `## Čo je na Moodli` – the materials and activities of that week (file names, what each one is).
- `## Čo sa robilo` – what the exercise teaches, step by step, in plain words.
- `## Čo si zapamätať` – the key takeaways and API calls.

The app lists the week's code exercises and questions automatically (by their `week` field) – do not paste code
listings into the week file; short snippets (≤ 6 lines) are fine.

## `codes/<topicId>/`

Code exercises for the study mode, where the student **types the code from memory** and the app compares it with
the reference.

- `index.json` – a JSON array of entries, in learning order.
- one `.py` file per entry – the reference solution.
- one `.md` file per `core` entry – the plain-language walkthrough (see below).

Entry:

```json
{
  "id": "w05-kfold-manual",
  "title": "K-fold krížová validácia ručne",
  "week": 5,
  "file": "w05-kfold-manual.py",
  "source": "moodle/w05/tasks/ex_01_showcase.py",
  "task": "Zadanie po slovensky: čo presne má študent napísať (dáta, model, parametre, čo vypísať). Musí stačiť na napísanie kódu naspamäť bez pohľadu na riešenie.",
  "explanation": "Markdown: vysvetlenie riešenia po krokoch – prečo je tam ktorý riadok, na čo si dať pozor.",
  "expectedOutput": "voliteľné: čo kód vypíše (skrátene)",
  "tags": ["KFold", "cross-validation"],
  "core": true
}
```

- `id` is unique across all topics, starts with the week (`w05-…`), kebab-case; `file` = `<id>.py`.
- `source` – where it comes from (`moodle/…`, `teams/…`, `archive/…`, `lecture/…`).
- `core` (optional, `true`) – marks a **typical exercise code**: one that was written in class (Moodle week /
  Teams `cv_NN`) and may appear on the test. The app lists these under "Kódy z cvičení" (the default list); the
  rest (lecture codes, homework, helper parts, variations) is only under "Všetky". Keep the set small – one entry
  per type of exercise.

### Walkthrough of a core exercise: `<id>.md`

Every `core` entry needs a plain-language walkthrough next to its `.py` file (the build fails without it). It is
shown as "Jednoducho vysvetlené" right under the solution and must let a beginner understand the **whole** code:

- `**O čo ide:**` – one or two sentences: what the code does and why, without jargon (explain every term used).
- `### Krok za krokom` – a numbered list following the code top to bottom. Quote the line (or its important
  part) in backticks **exactly as in the `.py`** and say in simple words what it does and why it is there.
  Cover every line that is not a plain import or print.
- `### Ako si to zapamätať` – 2–4 bullets: the skeleton of the code and the mnemonic.
- Short sentences, concrete numbers from the real output, no new facts beyond the course materials. Caveats and
  finer points stay in `explanation` (shown below as "Podrobnosti a na čo si dať pozor").
- Same Markdown rules as the theory. Do not put fenced code blocks or tables inside list items.

Reference `.py` rules:

- It is the **solution of the exercise as done in class**: keep the libraries, API calls, variable names and
  parameter values of the original. `_task` files must be completed into working solutions.
- It must **run** (verify with `D:\SKOLA\ISI\.venv\Scripts\python.exe`, set `MPLBACKEND=Agg` for plots; run from
  the folder of the original so relative data paths work, or adapt the path only for the test run).
- Compact enough to memorise: **10–40 lines**. Drop decoration (long plotting code, repeated prints, GUI code);
  split a long exercise into several entries (`…-part1`, `…-part2`) instead of exceeding 40 lines.
- Comments are optional and short (the checker ignores comments and blank lines). English or Slovak without
  diacritics.
- Mark the **key lines** – the 3–8 lines that carry the idea (the model, the split, `fit`, the loop condition, the
  queue pop, …) – with a trailing marker comment `#!`:

  ```python
  kf = KFold(n_splits=5, shuffle=True, random_state=1)  #!
  ```

  The build strips the marker. The fill-in mode blanks exactly these lines.
- 4-space indentation, no tabs, no trailing whitespace, ends with a newline.

## `questions/<topicId>.json` (and `questions/quizlet.json`)

A JSON array of multiple-choice questions in the style of the real test: several options, **one or more correct**,
a single wrong tick means zero points for the question.

```json
{
  "id": "t4-q01",
  "topicId": "t4-validacia-ladenie",
  "week": 5,
  "type": "theory",
  "source": "moodle",
  "text": "Ktoré tvrdenia o K-fold krížovej validácii sú pravdivé?",
  "code": "voliteľný úryvok kódu v Pythone (\\n ako oddeľovač riadkov)",
  "options": [
    { "text": "Každá vzorka je práve raz vo validačnej časti.", "correct": true },
    { "text": "Model sa trénuje iba raz.", "correct": false }
  ],
  "explanation": "Prečo sú správne tie správne a prečo sú nesprávne tie nesprávne."
}
```

- `id` unique across all files: `<topic number>-qNN` (`t4-q01`), Quizlet ones `qz-NN`.
- `type`: `theory` (concepts, properties, definitions) or `practical` (reading code, output of code, the missing
  line, the right API call, tracing an algorithm on a small example).
- `source`: `moodle` | `lecture` | `teams` | `archive` | `quizlet` | `generated` – where the tested fact comes from.
- `week`: 1–10, or `null` when it is not tied to one week.
- `options`: 4–6 items, at least one correct **and** at least one wrong. Do not use "všetky uvedené" / "žiadna
  z uvedených". Vary the number of correct options (1, 2, 3…) so it cannot be guessed. Plausible distractors only.
- `text`, option `text` and `explanation` may contain `inline code` in backticks; nothing else is formatted.
- `code` only for `practical` questions; ≤ 25 lines.
- `explanation` is required – it is shown in the review and is where the learning happens.
- Optional `"disputed": true` + a sentence in `explanation` when a Quizlet answer contradicts the lectures.
- Every fact must be backed by the course materials (for the search/CSP topics: the exercise materials, the
  lectures of J. Gazda from 2026 and 2020, and standard AIMA definitions). No trick questions on trivia.

## `speed.json`

The "Speed mód" – a playful digest for a student who only wants the exam facts (exercises, code snippets,
libraries). Facts come from the codes, theory and questions above; nothing new beyond the course materials.

```json
{
  "levels": [
    {
      "id": "s4", "topicId": "t4-validacia-ladenie", "icon": "🔬",
      "title": "Validácia a ladenie: K-fold, GridSearch, Pipeline",
      "tagline": "one playful sentence",
      "flow": [{ "icon": "🧱", "text": "`Pipeline([...])`" }],
      "hook": "mnemonic",
      "traps": ["typical exam trap"],
      "cards": [
        { "id": "s4-01", "icon": "🍰", "q": "question", "a": "answer", "code": "optional snippet", "codeId": "w05-kfold-split" }
      ]
    }
  ],
  "libraries": [
    { "module": "sklearn.model_selection", "icon": "✂️", "nick": "Deliareň", "import": "from sklearn.model_selection import ...",
      "items": [{ "name": "KFold", "what": "k foldov na krížovú validáciu" }] }
  ]
}
```

- One level per topic, in topic order. `flow` = 2–7 steps of the exercise as a picture recipe (icon + short text);
  `hook` = one mnemonic; `traps` = typical exam traps.
- Cards: ids unique, short question `q` and answer `a` (inline code in backticks allowed); `code` ≤ 8 lines, copied
  from the reference `.py` (same names and values); `codeId` must be an existing code exercise id.
- Libraries: one shelf per module with the import line as used in the exercise codes. Item `name`s are unique and
  their `what` texts should differ – the 60-second quiz uses other modules / descriptions as wrong options.
