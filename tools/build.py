#!/usr/bin/env python3
"""Validates the content folder and bundles it into js/data.js (window.ISI_DATA).

Usage: python tools/build.py [--content DIR] [--out FILE] [--check] [--lenient]
"""
import argparse
import html
import io
import json
import re
import sys
import tokenize
import unicodedata
import warnings
from datetime import datetime, timezone
from pathlib import Path

import markdown

ROOT = Path(__file__).resolve().parent.parent
DATA_VERSION = 1
WEEK_MIN, WEEK_MAX = 1, 10
QUESTION_TYPES = ("theory", "practical")
QUESTION_SOURCES = ("moodle", "lecture", "teams", "archive", "quizlet", "generated")
CODE_SOURCE_PREFIXES = ("moodle", "teams", "archive", "lecture")
QUESTION_KEYS = {"id", "topicId", "week", "type", "source", "text", "code", "options", "explanation", "disputed"}
CODE_KEYS = {"id", "title", "week", "file", "source", "task", "explanation", "expectedOutput", "tags", "core"}
MAX_CODE_LINES = 40
MAX_QUESTION_CODE_LINES = 25
SAFE_ID = re.compile(r"^[A-Za-z0-9][A-Za-z0-9_.-]*$")
SUMMARY_HEADING = re.compile(r"^##\s+r[ýy]chle\s+zhrnutie\s*$", re.IGNORECASE)
BANNED_OPTIONS = re.compile(r"^(všetky|vsetky|žiadna|ziadna|žiadne|ziadne)\s+(z\s+)?(uveden|vyššie|vyssie)", re.IGNORECASE)


class Report:
    def __init__(self, content):
        self.content = content
        self.errors = []
        self.warnings = []

    def _where(self, path, item_id):
        try:
            name = Path(path).relative_to(self.content).as_posix()
        except ValueError:
            name = str(path)
        return f"{name} [{item_id}]" if item_id else name

    def error(self, path, message, item_id=None):
        self.errors.append(f"{self._where(path, item_id)}: {message}")

    def warn(self, path, message, item_id=None):
        self.warnings.append(f"{self._where(path, item_id)}: {message}")


def read_text(path, rep):
    try:
        raw = path.read_bytes()
    except OSError as exc:
        rep.error(path, f"cannot read file ({exc})")
        return None
    if raw.startswith(b"\xef\xbb\xbf"):
        rep.warn(path, "file starts with a UTF-8 BOM")
        raw = raw[3:]
    try:
        text = raw.decode("utf-8")
    except UnicodeDecodeError as exc:
        rep.error(path, f"not valid UTF-8 ({exc})")
        return None
    return text.replace("\r\n", "\n").replace("\r", "\n")


def read_json(path, rep):
    text = read_text(path, rep)
    if text is None:
        return None
    try:
        return json.loads(text)
    except json.JSONDecodeError as exc:
        rep.error(path, f"invalid JSON: {exc.msg} (line {exc.lineno}, column {exc.colno})")
        return None


def is_int(value):
    return isinstance(value, int) and not isinstance(value, bool)


def is_text(value):
    return isinstance(value, str) and value.strip() != ""


def valid_week(value):
    return is_int(value) and WEEK_MIN <= value <= WEEK_MAX


# ---------------------------------------------------------------- Markdown

def render_markdown(text, line_breaks=False):
    extensions = ["tables", "fenced_code", "sane_lists"]
    if line_breaks:
        extensions.append("nl2br")
    return markdown.Markdown(extensions=extensions, output_format="html").convert(text)


def plain_text(fragment):
    fragment = re.sub(r"</?(code|strong|em|a|b|i|del)(\s[^>]*)?>", "", fragment)
    return re.sub(r"\s+", " ", html.unescape(re.sub(r"<[^>]+>", " ", fragment))).strip()


def slugify(text):
    text = unicodedata.normalize("NFKD", text)
    text = "".join(ch for ch in text if not unicodedata.combining(ch))
    return re.sub(r"[^A-Za-z0-9]+", "-", text).strip("-").lower() or "sekcia"


def decorate_html(fragment):
    """Adds heading ids, opens external links in a new tab, makes tables scrollable."""
    headings = []
    used = set()

    def heading(match):
        level, inner = int(match.group(1)), match.group(2)
        text = plain_text(inner)
        base = slugify(text)
        slug, n = base, 2
        while slug in used:
            slug, n = f"{base}-{n}", n + 1
        used.add(slug)
        headings.append({"id": slug, "level": level, "text": text})
        return f'<h{level} id="{slug}">{inner}</h{level}>'

    fragment = re.sub(r"<h([1-6])>(.*?)</h\1>", heading, fragment, flags=re.S)
    fragment = re.sub(r'<a href="(https?://[^"]*)"', r'<a href="\1" target="_blank" rel="noopener noreferrer"', fragment)
    fragment = fragment.replace("<table>", '<div class="table-wrap"><table>').replace("</table>", "</table></div>")
    return fragment, headings


def strip_title(fragment):
    """Removes the leading <h1> (the app prints the title itself) and returns its text."""
    match = re.match(r'\s*<h1 id="[^"]*">(.*?)</h1>\s*', fragment, flags=re.S)
    if not match:
        return fragment, None
    return fragment[match.end():], plain_text(match.group(1))


def split_sections(fragment, page_title):
    """Plain text per h2/h3 section for the full-text search."""
    sections = []
    current = {"id": "", "title": page_title, "parts": []}
    for piece in re.split(r'(<h[23] id="[^"]*">.*?</h[23]>)', fragment, flags=re.S):
        match = re.match(r'<h[23] id="([^"]*)">(.*?)</h[23]>', piece, flags=re.S)
        if match:
            sections.append(current)
            current = {"id": match.group(1), "title": plain_text(match.group(2)), "parts": []}
        else:
            current["parts"].append(piece)
    sections.append(current)
    result = []
    for section in sections:
        text = plain_text(" ".join(section["parts"]))
        if text or section["id"]:
            result.append({"id": section["id"], "title": section["title"], "text": text})
    return result


def markdown_outside_code(text):
    """The Markdown source without fenced blocks and inline code (for the format checks)."""
    kept, fence = [], None
    for line in text.split("\n"):
        marker = re.match(r"^\s*(```+|~~~+)", line)
        if marker:
            if fence is None:
                fence = marker.group(1)[0]
            elif marker.group(1)[0] == fence:
                fence = None
            continue
        if fence is None:
            kept.append(re.sub(r"`[^`]*`", "", line))
    return "\n".join(kept)


def extract_section(text, heading_pattern):
    """Body of the `##` section whose heading matches, or None."""
    body, fence, inside = [], None, False
    for line in text.split("\n"):
        marker = re.match(r"^\s*(```+|~~~+)", line)
        if marker:
            if fence is None:
                fence = marker.group(1)[0]
            elif marker.group(1)[0] == fence:
                fence = None
        elif fence is None and re.match(r"^##?\s", line):
            if inside:
                break
            inside = bool(heading_pattern.match(line.strip()))
            continue
        if inside:
            body.append(line)
    return "\n".join(body).strip() if inside or body else None


def check_markdown_rules(text, path, rep):
    outside = markdown_outside_code(text)
    if re.search(r"!\[[^\]]*\]\(", outside):
        rep.warn(path, "images are not allowed")
    if re.search(r"</?[a-zA-Z][a-zA-Z0-9]*(\s[^<>]*)?>", outside):
        rep.warn(path, "raw HTML is not allowed")
    if re.search(r"\$\$|\\frac|\\\(|\\\[", outside):
        rep.warn(path, "LaTeX is not allowed - write formulas in plain text")


# ---------------------------------------------------------------- topics, theory, weeks

def load_topics(content, rep):
    path = content / "topics.json"
    if not path.is_file():
        rep.error(path, "file is missing")
        return []
    data = read_json(path, rep)
    if data is None:
        return []
    if not isinstance(data, list):
        rep.error(path, "must be a JSON array")
        return []
    topics, seen = [], set()
    for index, item in enumerate(data):
        label = item.get("id") if isinstance(item, dict) and isinstance(item.get("id"), str) else f"#{index + 1}"
        if not isinstance(item, dict):
            rep.error(path, "topic must be an object", label)
            continue
        ok = True
        if not is_text(item.get("id")) or not SAFE_ID.match(item["id"]):
            rep.error(path, "`id` is missing or contains characters other than letters, digits, - _ .", label)
            ok = False
        elif item["id"] in seen:
            rep.error(path, "duplicate topic id", label)
            ok = False
        if not is_int(item.get("order")):
            rep.error(path, "`order` must be an integer", label)
            ok = False
        weeks = item.get("weeks")
        if not isinstance(weeks, list) or not weeks or not all(valid_week(w) for w in weeks):
            rep.error(path, f"`weeks` must be a non-empty array of integers {WEEK_MIN}-{WEEK_MAX}", label)
            ok = False
        if not is_text(item.get("title")):
            rep.error(path, "`title` is required", label)
            ok = False
        if ok:
            seen.add(item["id"])
            topics.append({"id": item["id"], "order": item["order"], "weeks": weeks, "title": item["title"].strip()})
    topics.sort(key=lambda t: t["order"])
    return topics


def build_theory(content, topics, rep):
    folder = content / "theory"
    files = {p.stem: p for p in sorted(folder.glob("*.md"))} if folder.is_dir() else {}
    known = {t["id"] for t in topics}
    for stem, path in files.items():
        if stem not in known:
            rep.error(path, "file name is not a topic id of topics.json")
    for topic in topics:
        topic.update({"theoryHtml": None, "toc": [], "sections": [], "summaryHtml": None})
        path = files.get(topic["id"])
        if path is None:
            rep.warn(folder / f"{topic['id']}.md", "no theory yet")
            continue
        text = read_text(path, rep)
        if text is None:
            continue
        if not text.strip():
            rep.warn(path, "file is empty")
            continue
        if not text.lstrip().startswith("# "):
            rep.warn(path, "should start with `# <title>`")
        check_markdown_rules(text, path, rep)
        body, headings = decorate_html(render_markdown(text))
        body, _ = strip_title(body)
        topic["theoryHtml"] = body
        topic["toc"] = [h for h in headings if h["level"] in (2, 3)]
        topic["sections"] = split_sections(body, topic["title"])
        summary = extract_section(text, SUMMARY_HEADING)
        if not summary:
            rep.warn(path, "section `## Rýchle zhrnutie` is missing or empty")
        else:
            bullets = len(re.findall(r"^[-*+]\s", summary, flags=re.M))
            if not 8 <= bullets <= 15:
                rep.warn(path, f"`Rýchle zhrnutie` has {bullets} bullets (expected 8-15)")
            topic["summaryHtml"] = decorate_html(render_markdown(summary))[0]


def build_weeks(content, topics, rep):
    folder = content / "weeks"
    files = {}
    if folder.is_dir():
        for path in sorted(folder.glob("*.md")):
            match = re.fullmatch(r"w(\d\d)", path.stem)
            if not match or not WEEK_MIN <= int(match.group(1)) <= WEEK_MAX:
                rep.error(path, f"file name must be w{WEEK_MIN:02d}.md - w{WEEK_MAX:02d}.md")
            else:
                files[int(match.group(1))] = path
    weeks = []
    for number in range(WEEK_MIN, WEEK_MAX + 1):
        week = {
            "n": number,
            "id": f"w{number:02d}",
            "title": f"{number}. týždeň",
            "html": None,
            "topicIds": [t["id"] for t in topics if number in t["weeks"]],
        }
        weeks.append(week)
        path = files.get(number)
        if path is None:
            rep.warn(folder / f"{week['id']}.md", "no week summary yet")
            continue
        text = read_text(path, rep)
        if text is None:
            continue
        if not text.strip():
            rep.warn(path, "file is empty")
            continue
        check_markdown_rules(text, path, rep)
        outside = markdown_outside_code(text)
        for required in ("Čo je na Moodli", "Čo sa robilo", "Čo si zapamätať"):
            if not re.search(rf"^##\s+{re.escape(required)}\s*$", outside, flags=re.M | re.I):
                rep.warn(path, f"section `## {required}` is missing")
        body, _ = decorate_html(render_markdown(text))
        body, title = strip_title(body)
        if title is None:
            rep.warn(path, "should start with `# <N>. týždeň – <short name>`")
        else:
            week["title"] = title
        week["html"] = body
    return weeks


# ---------------------------------------------------------------- code exercises

def marker_rest(comment, row, col):
    """The comment without the `#!` marker, or None when the comment is no marker."""
    if row == 1 and col == 0 and comment.startswith("#!/"):
        return None
    stripped = comment.rstrip()
    if stripped == "#!":
        return ""
    if stripped.endswith("#!"):
        rest = stripped[:-2].rstrip()
        return "" if rest in ("", "#") else rest
    if comment.startswith("#!") and comment[2] in " \t":
        return "# " + comment[2:].strip()
    return None


def process_code(text, path, rep, item_id):
    """Strips the key-line markers and checks the formatting; returns (code, key lines) or None."""
    ok = True
    if "\t" in text:
        row = text[: text.index("\t")].count("\n") + 1
        rep.error(path, f"tab character on line {row} (use 4 spaces)", item_id)
        ok = False
    if not text.endswith("\n"):
        rep.warn(path, "file does not end with a newline", item_id)
    lines = text.split("\n")
    if any(line != line.rstrip() for line in lines):
        rep.warn(path, "trailing whitespace", item_id)
    lines = [line.rstrip() for line in lines]
    while lines and not lines[-1]:
        lines.pop()
    if not lines:
        rep.error(path, "file is empty", item_id)
        return None

    def tokens(source_lines):
        return list(tokenize.generate_tokens(io.StringIO("\n".join(source_lines) + "\n").readline))

    edits = {}
    try:
        for tok in tokens(lines):
            if tok.type == tokenize.COMMENT:
                rest = marker_rest(tok.string, *tok.start)
                if rest is not None:
                    edits[tok.start[0] - 1] = (tok.start[1], rest)
    except (tokenize.TokenError, SyntaxError) as exc:
        rep.error(path, f"cannot tokenize the code: {exc}", item_id)
        return None

    result, key_lines = [], []
    for index, line in enumerate(lines):
        if index not in edits:
            result.append(line)
            continue
        col, rest = edits[index]
        code_part = line[:col].rstrip()
        if not code_part.strip():
            rep.warn(path, f"`#!` on line {index + 1} marks no code - ignored", item_id)
            if rest:
                result.append(line[:col] + rest)
            continue
        key_lines.append(len(result))
        result.append(code_part + ("  " + rest if rest else ""))
    code = "\n".join(result)

    try:
        with warnings.catch_warnings():
            warnings.simplefilter("error", SyntaxWarning)
            compile(code + "\n", str(path), "exec")
    except SyntaxWarning as exc:
        rep.warn(path, f"syntax warning: {exc}", item_id)
    except (SyntaxError, ValueError) as exc:
        where = f" (line {exc.lineno})" if getattr(exc, "lineno", None) else ""
        rep.error(path, f"syntax error{where}: {getattr(exc, 'msg', exc)}", item_id)
        return None

    # Continuation lines inside brackets may be aligned freely; block indentation must step by 4.
    depth = [0]
    for tok in tokens(result):
        if tok.type == tokenize.INDENT:
            width = len(tok.string)
            if width - depth[-1] != 4 and "\t" not in tok.string:
                rep.error(path, f"line {tok.start[0]} is indented by {width - depth[-1]} spaces (use 4)", item_id)
                ok = False
            depth.append(width)
        elif tok.type == tokenize.DEDENT:
            depth.pop()

    code_lines = sum(1 for line in result if line.strip() and not line.strip().startswith("#"))
    if code_lines > MAX_CODE_LINES:
        rep.warn(path, f"{code_lines} lines of code (more than {MAX_CODE_LINES}) - split the exercise", item_id)
    if not key_lines:
        rep.warn(path, "no key lines marked with `#!`", item_id)
    elif not 3 <= len(key_lines) <= 8:
        rep.warn(path, f"{len(key_lines)} key line(s) marked (expected 3-8)", item_id)
    return (code, key_lines) if ok else None


def build_codes(content, topics, rep):
    folder = content / "codes"
    codes, seen = [], set()
    known = {t["id"]: t for t in topics}
    folders = {p.name: p for p in sorted(folder.iterdir()) if p.is_dir()} if folder.is_dir() else {}
    for name, path in folders.items():
        if name not in known:
            rep.error(path, "folder name is not a topic id of topics.json")
    for topic in topics:
        base = folders.get(topic["id"])
        index_path = (base or folder / topic["id"]) / "index.json"
        if base is None or not index_path.is_file():
            if base is not None and any(base.glob("*.py")):
                rep.error(index_path, "index.json is missing")
            else:
                rep.warn(index_path, "no code exercises yet")
            continue
        entries = read_json(index_path, rep)
        if entries is None:
            continue
        if not isinstance(entries, list):
            rep.error(index_path, "must be a JSON array")
            continue
        if not entries:
            rep.warn(index_path, "no code exercises yet")
        listed, walkthroughs = set(), set()
        for position, entry in enumerate(entries):
            label = entry.get("id") if isinstance(entry, dict) and isinstance(entry.get("id"), str) else f"#{position + 1}"
            if not isinstance(entry, dict):
                rep.error(index_path, "entry must be an object", label)
                continue
            ok = True
            for field in ("id", "title", "file", "source", "task", "explanation"):
                if not is_text(entry.get(field)):
                    rep.error(index_path, f"`{field}` is required", label)
                    ok = False
            if not valid_week(entry.get("week")):
                rep.error(index_path, f"`week` must be an integer {WEEK_MIN}-{WEEK_MAX}", label)
                ok = False
            for field in sorted(set(entry) - CODE_KEYS):
                rep.warn(index_path, f"unknown field `{field}`", label)
            if "expectedOutput" in entry and entry["expectedOutput"] is not None and not isinstance(entry["expectedOutput"], str):
                rep.error(index_path, "`expectedOutput` must be a string", label)
                ok = False
            if not isinstance(entry.get("core", False), bool):
                rep.error(index_path, "`core` must be true or false", label)
                ok = False
            tags = entry.get("tags", [])
            if tags is None:
                tags = []
            if not isinstance(tags, list) or not all(isinstance(tag, str) for tag in tags):
                rep.error(index_path, "`tags` must be an array of strings", label)
                ok = False
            if not ok:
                continue
            code_id, file_name, week = entry["id"], entry["file"], entry["week"]
            if not SAFE_ID.match(code_id):
                rep.error(index_path, "`id` may contain only letters, digits, - _ .", label)
                continue
            if code_id in seen:
                rep.error(index_path, "duplicate code exercise id", label)
                continue
            seen.add(code_id)
            if not re.fullmatch(r"w\d\d-[a-z0-9]+(-[a-z0-9]+)*", code_id):
                rep.warn(index_path, "`id` should be kebab-case starting with the week (`w05-...`)", label)
            elif int(code_id[1:3]) != week:
                rep.warn(index_path, f"`id` starts with w{code_id[1:3]} but `week` is {week}", label)
            if file_name != f"{code_id}.py":
                rep.warn(index_path, f"`file` should be `{code_id}.py`", label)
            if week not in topic["weeks"]:
                rep.warn(index_path, f"week {week} is not a week of topic {topic['id']}", label)
            if entry["source"].split("/")[0] not in CODE_SOURCE_PREFIXES:
                rep.warn(index_path, f"`source` should start with one of {', '.join(CODE_SOURCE_PREFIXES)}", label)
            code_path = base / file_name
            if Path(file_name).name != file_name or not code_path.is_file():
                rep.error(index_path, f"code file `{file_name}` does not exist", label)
                continue
            listed.add(file_name)
            text = read_text(code_path, rep)
            if text is None:
                continue
            processed = process_code(text, code_path, rep, code_id)
            if processed is None:
                continue
            code, key_lines = processed
            # A core exercise (the typical codes done in class) has a plain walkthrough in `<id>.md`.
            core = entry.get("core", False)
            simple_html = None
            if core:
                simple_path = base / f"{code_id}.md"
                walkthroughs.add(simple_path.name)
                simple = read_text(simple_path, rep) if simple_path.is_file() else None
                if simple is None or not simple.strip():
                    rep.error(index_path, f"core exercise needs the walkthrough `{simple_path.name}`", label)
                    continue
                check_markdown_rules(simple, simple_path, rep)
                simple_html = decorate_html(render_markdown(simple.strip()))[0]
            codes.append({
                "id": code_id,
                "topicId": topic["id"],
                "title": entry["title"].strip(),
                "week": week,
                "source": entry["source"].strip(),
                "taskHtml": render_markdown(entry["task"].strip(), line_breaks=True),
                "explanationHtml": decorate_html(render_markdown(entry["explanation"].strip()))[0],
                "expectedOutput": (entry.get("expectedOutput") or "").rstrip() or None,
                "tags": [tag.strip() for tag in tags if tag.strip()],
                "code": code,
                "keyLines": key_lines,
                "core": core,
                "simpleHtml": simple_html,
            })
        for extra in sorted(p.name for p in base.glob("*.py") if p.name not in listed):
            rep.warn(base / extra, "code file is not listed in index.json")
        for extra in sorted(p.name for p in base.glob("*.md") if p.name not in walkthroughs):
            rep.warn(base / extra, "walkthrough does not belong to a `core` exercise of index.json")
    return codes


# ---------------------------------------------------------------- questions

def build_question(item, path, label, file_topic, known, rep):
    ok = True

    def fail(message):
        nonlocal ok
        rep.error(path, message, label)
        ok = False

    for field in sorted(set(item) - QUESTION_KEYS):
        rep.warn(path, f"unknown field `{field}`", label)
    if not is_text(item.get("id")):
        fail("`id` is required")
    elif not SAFE_ID.match(item["id"]):
        fail("`id` may contain only letters, digits, - _ .")
    elif not re.fullmatch(r"(t\d+-q\d+|qz-\d+)", item["id"]):
        rep.warn(path, "`id` should look like `t4-q01` or `qz-01`", label)

    topic_id = item.get("topicId")
    if topic_id is None:
        if file_topic is not None:
            topic_id = file_topic
            rep.warn(path, f"`topicId` is missing - using the file's topic `{file_topic}`", label)
        else:
            rep.warn(path, "`topicId` is missing - the question belongs to no topic", label)
    elif not isinstance(topic_id, str) or topic_id not in known:
        fail(f"`topicId` {topic_id!r} is not a topic id of topics.json")
    elif file_topic is not None and topic_id != file_topic:
        rep.warn(path, f"`topicId` {topic_id} differs from the file name", label)

    week = item.get("week")
    if "week" not in item:
        rep.warn(path, "`week` is missing - treated as null", label)
    elif week is not None and not valid_week(week):
        fail(f"`week` must be an integer {WEEK_MIN}-{WEEK_MAX} or null")
    if item.get("type") not in QUESTION_TYPES:
        fail(f"`type` must be one of {', '.join(QUESTION_TYPES)}")
    if item.get("source") not in QUESTION_SOURCES:
        fail(f"`source` must be one of {', '.join(QUESTION_SOURCES)}")
    if not is_text(item.get("text")):
        fail("`text` is required")
    if not is_text(item.get("explanation")):
        fail("`explanation` is required")
    if "disputed" in item and not isinstance(item["disputed"], bool):
        fail("`disputed` must be true or false")

    code = item.get("code")
    if code is not None and not isinstance(code, str):
        fail("`code` must be a string")
        code = None
    if code is not None:
        code = code.replace("\r\n", "\n").replace("\r", "\n")
        if "\t" in code:
            rep.warn(path, "`code` contains tabs - replaced by 4 spaces", label)
            code = code.replace("\t", "    ")
        code = "\n".join(line.rstrip() for line in code.split("\n")).strip("\n")
        if not code.strip():
            code = None
        else:
            if item.get("type") == "theory":
                rep.warn(path, "`code` is meant for practical questions only", label)
            if code.count("\n") + 1 > MAX_QUESTION_CODE_LINES:
                rep.warn(path, f"`code` has more than {MAX_QUESTION_CODE_LINES} lines", label)

    options = item.get("options")
    clean = []
    if not isinstance(options, list):
        fail("`options` must be an array")
    else:
        for number, option in enumerate(options, 1):
            if not isinstance(option, dict) or not is_text(option.get("text")) or not isinstance(option.get("correct"), bool):
                fail(f"option {number} needs a non-empty `text` and a boolean `correct`")
                continue
            if BANNED_OPTIONS.match(option["text"].strip()):
                rep.warn(path, f"option {number} is a 'všetky/žiadna z uvedených' option", label)
            clean.append({"text": option["text"].strip(), "correct": option["correct"]})
        # Quizlet cards stay faithful to their source: their option count and all-correct cards only warn.
        faithful = item.get("source") == "quizlet"
        count = len(options)
        if count == 0:
            fail("at least one option is required")
        elif not 4 <= count <= 6:
            message = f"{count} option(s) (expected 4-6)"
            if faithful or 2 <= count < 4:
                rep.warn(path, message, label)
            else:
                fail(message)
        if len(clean) == count and count:
            if not any(option["correct"] for option in clean):
                fail("no option is correct")
            elif all(option["correct"] for option in clean):
                if faithful:
                    rep.warn(path, "every option is correct (no wrong option)", label)
                else:
                    fail("no option is wrong")
            if len({option["text"] for option in clean}) != len(clean):
                rep.warn(path, "two options have the same text", label)
    if not ok:
        return None
    return {
        "id": item["id"],
        "topicId": topic_id,
        "week": week,
        "type": item["type"],
        "source": item["source"],
        "text": item["text"].strip(),
        "code": code,
        "options": clean,
        "explanation": item["explanation"].strip(),
        "disputed": bool(item.get("disputed", False)),
    }


def build_questions(content, topics, rep):
    folder = content / "questions"
    known = {t["id"] for t in topics}
    order = {t["id"]: t["order"] for t in topics}
    paths = sorted(folder.glob("*.json")) if folder.is_dir() else []
    paths.sort(key=lambda p: (0, order[p.stem]) if p.stem in order else (1, 0))
    questions, seen = [], set()
    for path in paths:
        file_topic = path.stem if path.stem in known else None
        if file_topic is None and path.stem != "quizlet":
            rep.warn(path, "file name is neither a topic id nor `quizlet`")
        data = read_json(path, rep)
        if data is None:
            continue
        if not isinstance(data, list):
            rep.error(path, "must be a JSON array")
            continue
        for position, item in enumerate(data):
            label = item.get("id") if isinstance(item, dict) and isinstance(item.get("id"), str) else f"#{position + 1}"
            if not isinstance(item, dict):
                rep.error(path, "question must be an object", label)
                continue
            question = build_question(item, path, label, file_topic, known, rep)
            if question is None:
                continue
            if question["id"] in seen:
                rep.error(path, "duplicate question id", label)
                continue
            seen.add(question["id"])
            questions.append(question)
    for topic in topics:
        if not any(q["topicId"] == topic["id"] for q in questions):
            rep.warn(folder / f"{topic['id']}.json", "no questions yet")
    return questions


# ---------------------------------------------------------------- output

def print_summary(topics, weeks, codes, questions):
    def count(topic_id, kind):
        return sum(1 for q in questions if q["topicId"] == topic_id and q["type"] == kind)

    width = max([len(t["id"]) for t in topics] + [10])
    print(f"{'Topic':<{width}}  Theory  Codes  Q theory  Q practical")
    for topic in topics:
        n_codes = sum(1 for c in codes if c["topicId"] == topic["id"])
        theory = "yes" if topic["theoryHtml"] else "no"
        print(f"{topic['id']:<{width}}  {theory:<6}  {n_codes:>5}  {count(topic['id'], 'theory'):>8}  "
              f"{count(topic['id'], 'practical'):>11}")
    if any(q["topicId"] is None for q in questions):
        print(f"{'(no topic)':<{width}}  {'-':<6}  {'-':>5}  {count(None, 'theory'):>8}  {count(None, 'practical'):>11}")
    total_theory = sum(1 for q in questions if q["type"] == "theory")
    print(f"{'Total':<{width}}  {sum(1 for t in topics if t['theoryHtml']):<6}  {len(codes):>5}  "
          f"{total_theory:>8}  {len(questions) - total_theory:>11}")
    missing = [w["id"] for w in weeks if not w["html"]]
    print(f"Weeks: {len(weeks) - len(missing)}/{len(weeks)} summaries" + (f" (missing: {', '.join(missing)})" if missing else ""))


def main(argv=None):
    parser = argparse.ArgumentParser(description="Validate the content and build js/data.js.")
    parser.add_argument("--content", type=Path, default=ROOT / "content", help="content folder (default: content)")
    parser.add_argument("--out", type=Path, default=ROOT / "js" / "data.js", help="output file (default: js/data.js)")
    parser.add_argument("--check", action="store_true", help="validate only, write nothing")
    parser.add_argument("--lenient", action="store_true",
                        help="write the output even with errors (invalid items are left out); still exits with 1")
    args = parser.parse_args(argv)
    for stream in (sys.stdout, sys.stderr):
        if hasattr(stream, "reconfigure"):
            stream.reconfigure(encoding="utf-8", errors="replace")

    content = args.content.resolve()
    if not content.is_dir():
        print(f"ERROR  content folder not found: {content}", file=sys.stderr)
        return 1
    rep = Report(content)
    topics = load_topics(content, rep)
    build_theory(content, topics, rep)
    weeks = build_weeks(content, topics, rep)
    codes = build_codes(content, topics, rep)
    questions = build_questions(content, topics, rep)

    for message in rep.warnings:
        print(f"WARN   {message}")
    for message in rep.errors:
        print(f"ERROR  {message}", file=sys.stderr)
    sys.stderr.flush()
    if rep.warnings or rep.errors:
        print()
    print_summary(topics, weeks, codes, questions)
    print(f"\n{len(rep.errors)} error(s), {len(rep.warnings)} warning(s)")

    if args.check:
        return 1 if rep.errors else 0
    if rep.errors and not args.lenient:
        print("Nothing written - fix the errors (or use --lenient to leave the invalid items out).")
        return 1
    data = {
        "version": DATA_VERSION,
        "builtAt": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "topics": topics,
        "weeks": weeks,
        "codes": codes,
        "questions": questions,
    }
    payload = json.dumps(data, ensure_ascii=False, separators=(",", ":"))
    args.out.parent.mkdir(parents=True, exist_ok=True)
    args.out.write_text(
        "// Generated by tools/build.py - do not edit by hand.\nwindow.ISI_DATA = " + payload + ";\n",
        encoding="utf-8", newline="\n")
    print(f"Wrote {args.out} ({args.out.stat().st_size / 1024:.0f} kB)")
    return 1 if rep.errors else 0


if __name__ == "__main__":
    sys.exit(main())
