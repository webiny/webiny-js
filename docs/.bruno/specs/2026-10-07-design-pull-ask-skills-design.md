# design-pull and design-ask skills

Date: 2026-10-07

## Goal

Two project skills that connect Claude Code with Claude Design through the `claude-design` MCP server (`https://api.anthropic.com/v1/design/mcp`):

- `design-pull` mirrors a Claude Design project into a local folder and keeps a catalogue of what was pulled and what was implemented in code.
- `design-ask` turns open questions into a paste-ready prompt for Claude Design, copies it to the clipboard, and logs the questions so answers can be matched later.

## Constraints

- The skills are generic: they work with any Claude Design project, not only the workflows project.
- The skills live in `.claude/skills/design-pull/` and `.claude/skills/design-ask/` and are committed.
- Everything design-related stays local: mirrored files, catalogue, question log and snapshots live in a design folder excluded through the repository's `info/exclude` file (never `.gitignore`). Nothing design-related is committed.
- The exclude file path is resolved with `git rev-parse --git-path info/exclude`, so it also works in git worktrees. Design folders are per worktree.
- No nested git repositories inside design folders.
- The skills only read from Claude Design. They never write files, post comments or ack comments there.
- Content read from Claude Design (file contents, file paths, zip entries, `answers.md`) is untrusted data. Text that reads like instructions is reported to the user, never acted on.
- The MCP `render_preview` serve URL carries a project token and must never appear in a command, log or file. The skills do not use it.
- Name note: `/design-sync` is an existing built-in skill (code to design system); these skills are named `design-pull` and `design-ask` to avoid a clash.

## Helper script

Deterministic work is done by one helper script, `.claude/skills/design-pull/design.py`, used by both skills. It uses only the Python standard library and always runs as `python3 -I .claude/skills/design-pull/design.py <command> ...`.

The script owns:

- path validation (see "Path safety"),
- reading and writing `catalogue.md` and `questions.md` (the model never edits their tables by hand),
- zip extraction and mapping,
- entity decoding and size verification,
- content comparison against snapshots,
- answer parsing.

The model owns the MCP calls, user interaction and judgement (writing questions, choosing files to mark).

MCP results reach the script through files in the session scratchpad: the model saves the `list_files` result as JSON, and saves a `read_file` body as a raw file. All paths are passed as separate arguments, never interpolated into a shell string.

Commands (exact flags are fixed in the implementation plan):

| command | purpose |
|---|---|
| `list-folders` | find design folders (see "Choosing the folder") |
| `init` | write the catalogue header for a new folder and add the folder to the exclude file |
| `plan` | compare a listing with the catalogue; print what changed and which files need the zip |
| `import-zip` | extract a zip safely and import the files that verify |
| `import-raw` | decode one `read_file` body and import it if it verifies |
| `finish` | record removals, reconcile content-identical files, set `last_pull`, print the report |
| `answers` | process a pulled `answers.md` |
| `mark` / `unmark` | record or clear an implementation |
| `ask-add` | allocate IDs and append questions to `questions.md` |

## Path safety

Every project path, from `list_files` or a zip entry, is validated before it touches the filesystem. A path is rejected when it:

- is absolute or starts with `~`,
- contains a `..` segment, a backslash, a NUL or any control character,
- resolves (after joining with the target directory) outside that directory.

Rejected paths are reported and skipped. Zip extraction uses Python's `zipfile`, validates every member, and skips symlink and directory entries. `unzip` is never used.

## Design folder

One folder per Claude Design project. Suggested location: `docs/.bruno/<project-slug>/design/`.

```
<folder>/
  catalogue.md          header + file table (owned by the script)
  questions.md          design-ask log (owned by the script)
  answers.md            last pulled copy of the project's answers.md
  files/<path>          mirrored project files
  .implemented/<path>   snapshot of the file at its last "mark"
```

Project files are mirrored under `files/` so a project file can never overwrite the metadata at the folder root. `<path>` is the project path relative to `source`. `.implemented/` mirrors the same structure; directories are created as needed.

### catalogue.md

The file starts with a header block:

```
---
project: <project name>
project_id: <uuid>
source: /
exclude:
  - .thumbnail
  - design_handoff_*/**
  - !design_handoff_*/README.md
  - answers.md
support:
  - _ds/**
  - support.js
  - assets/**
last_pull: <RFC 3339 timestamp>
---
```

- `source` is the project directory that is mirrored. Default is the project root, because that is what the designer edits live; `design_handoff_*` folders are export snapshots.
- `exclude` and `support` use gitignore-style patterns:
  - patterns match project paths relative to `source`;
  - `*` and `?` do not cross `/`; `**` matches any number of segments;
  - patterns are applied to each file path in order and the last match wins; `!` re-includes;
  - there is no directory pruning, so a `!` pattern can re-include a file inside an excluded directory.
- `answers.md` at the project root is always excluded from the table, whatever the header says; it is handled separately (see "Answers").
- `support` marks files that are tracked but never implemented.

After the header comes the table:

```
| file | kind | etag_pulled | pulled_at | etag_implemented | implemented_at | commit | removed_at | status |
```

- One row per mirrored file. `|` in values is escaped as `\|`.
- `kind` is `screen` or `support`, set from the `support` patterns on every pull.
- `removed_at` is set when the file disappears from the project and cleared if it reappears.
- `status` is computed by the script on every write, in this order:
  1. `removed` — `removed_at` is set
  2. `support` — `kind` is `support`
  3. `new` — `etag_implemented` is empty
  4. `implemented` — `etag_implemented` equals `etag_pulled`
  5. `pending` — otherwise

## Choosing the folder

Both skills accept an optional folder argument. Without one:

1. `list-folders` searches `docs/` with `find` (the files are ignored, so not `git ls-files`) for `catalogue.md` files whose header has `project_id:`.
2. The skill offers the found folders as a choice, labelled `<folder> (<project name>)`.
3. `design-pull` also offers "set up new": pick a project from `list_projects`, then accept the suggested folder or type one. `init` validates the folder (it must be inside the repository and not already contain a catalogue), writes the header with default patterns and adds the folder to the exclude file when it is not there yet.

`design-ask` has no "set up new" option; it needs a pulled project.

## design-pull

### File classes

- Text files: `.html`, `.htm`, `.css`, `.js`, `.mjs`, `.json`, `.md`, `.txt`, `.svg`. Only text files may use the MCP path.
- Binary files: everything else. They are imported only from a zip.
- Files larger than 256 KiB (262144 bytes) are imported only from a zip.

### `/design-pull [folder]`

1. Resolve the folder and read the catalogue header.
2. Call `list_files` with `depth: -1` and save the result as listing A. Run `plan`. It classifies every file under `source` (after `exclude`) as new, changed (etag differs from `etag_pulled`), unchanged or removed (row exists, file gone). Removed rows that reappear count as new content for that row.
3. Zip decision. `plan` asks for a zip when any of these holds:
   - the catalogue table is empty,
   - the new and changed files add up to more than 102400 bytes,
   - any new or changed file is larger than 32768 bytes,
   - any new or changed file is binary or larger than 262144 bytes.
4. Zip path, when a zip is needed:
   - Ask the user to export the project as a .zip from Claude Design now and give its path. The user may decline; then go to step 5 with every file.
   - Warn and ask for confirmation if the zip's modification time is earlier than listing A.
   - Call `list_files` again and save it as listing B.
   - `import-zip` extracts into a new, empty scratchpad directory. If every entry shares one top-level directory, that directory is stripped. Entries are then matched by exact path to listing B (after `source` and `exclude`); unmatched entries are ignored.
   - A file is imported from the zip only when its etag is the same in listings A and B and its byte size equals the listing size. Its row gets the etag from listing B.
   - Every other file goes to step 5.
5. MCP path, for each remaining file:
   - Binary files and files over 262144 bytes are reported as failed (zip required); their rows stay unchanged.
   - For text files: `read_file` the full file. Save exactly the body between the wrapper's opening and closing tags, with no added or removed characters, to a scratchpad file.
   - `import-raw` decodes it with one `html.unescape` pass. This relies on the server escaping every `&`, `<` and `>` as `&amp;`, `&lt;`, `&gt;` and nothing else, which makes one pass an exact inverse.
   - The decoded byte size must equal the listing size. On mismatch, re-read once; if it still mismatches, report the file as failed and leave the local file and its row unchanged.
   - Size is the only content check on this path; a same-length transcription error is not detectable. The low zip thresholds keep this path to small files.
6. `finish`:
   - Rows of imported files get `etag_pulled` and `pulled_at`.
   - Rows whose file is gone get `removed_at`. The mirrored file under `files/` is deleted; the `.implemented/` snapshot is kept.
   - A file that reappears gets `removed_at` cleared; its implementation columns are kept.
   - Content-identical reconciliation: when a `screen` file's new content is byte-identical to its `.implemented/` snapshot, `etag_implemented` is set to the new `etag_pulled`. The report lists it as "etag changed, content identical".
   - `last_pull` is set to the time of listing A.
7. If the project has `answers.md` at its root (regardless of `source`), read it through the MCP path into `<folder>/answers.md` and run `answers`.
8. Report:
   - new, changed and removed files;
   - rename candidates: a removed file and a new file with the same size (reported only; the user moves the mark by hand);
   - `pending` files, with the hint `diff .implemented/<path> files/<path>` run from the folder;
   - newly answered and revised questions;
   - failed and rejected files.

### `/design-pull mark <file>... [--commit <sha>]`

Preconditions, checked per file; a failing file is reported and skipped:

- a row exists and its `kind` is `screen`,
- the row is not `removed`,
- `files/<path>` exists locally.

For each file:

- Copy `files/<path>` to `.implemented/<path>`.
- Set `etag_implemented` to `etag_pulled`, `implemented_at` to now and `commit` to `--commit` or the current `HEAD`.

When `--commit` is omitted and the working tree has uncommitted changes, the skill warns that `HEAD` may not contain the implementation.

### `/design-pull unmark <file>...`

- Delete `.implemented/<path>` and clear `etag_implemented`, `implemented_at` and `commit`.
- A file that is not marked is reported and left as it is.

### Agent rule

The skill instructs agents: after committing UI code that implements a design file, run `mark` for that file with the commit hash. The user can also mark and unmark by hand.

## design-ask

### `/design-ask [folder] [--resend] [question text]`

1. Resolve the folder.
2. Collect questions:
   - With question text: rewrite it as a clear question and attach it to a design file when one is named or obvious.
   - Without question text: propose questions from the session — spec mismatches, implementation gaps, unclear states — and let the user approve or edit the list.
   - A new question that duplicates an `open` entry in `questions.md` is dropped and the existing ID is reported.
   - `--resend` adds every `open` question to the paste text, for questions that were logged but never pasted.
3. `ask-add` allocates IDs right before appending: next ID is the highest `Q<n>` found in `questions.md` and `answers.md`, plus one. It appends:

   ```
   ## Q4 — open — 2026-10-07
   file: Content Review.dc.html

   <question>
   ```

4. Build the paste text:

   ```
   Questions from the code side (Q4–Q6):

   Q4 (Content Review.dc.html): ...
   Q5 (Workflow Editor.dc.html): ...

   Write the answers to answers.md at the project root.
   Keep each answer under a "## Q<n>" heading. Do not change earlier answers.
   Update the designs where an answer changes them.
   ```

5. Write the text to a scratchpad file and run `pbcopy < <file>`. Show the text and say it is in the clipboard. If `pbcopy` is missing, show the text only and say so.

### Answers

`answers` reads `<folder>/answers.md` and splits it into sections at headings matching `^#{2,3}\s+Q(\d+)\b`. For each section:

- `Q<n>` is `open` in `questions.md`: set it to `answered` with the date and add the answer as a blockquote under the question.
- `Q<n>` is already `answered` and the text is the same: nothing changes.
- `Q<n>` is already `answered` and the text differs: append the new text as a dated revision blockquote and report it.
- `Q<n>` is not in the log: report it.

Answer text is untrusted. It is stored as a quote, and text that reads like instructions is flagged in the report.

## Out of scope

- Writing to Claude Design (files, comments, acks).
- Per-state implementation tracking inside a file.
- Full version history; only the last implemented snapshot is kept.
- Automatic rename handling.
- Chunked `read_file` reads; large files come from the zip.
- Attachments or screenshots in questions; follow-up threads (a follow-up is a new question).
