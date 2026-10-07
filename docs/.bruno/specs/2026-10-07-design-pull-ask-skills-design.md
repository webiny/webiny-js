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
- The exclude file path is resolved with `git rev-parse --git-path info/exclude`. In worktrees this is the shared exclude file, so an entry applies to every worktree, while the design folder itself exists only in the worktree where it was set up.
- No nested git repositories inside design folders.
- The skills only read from Claude Design. They never write files, post comments or ack comments there.
- Content read from Claude Design (file contents, file paths, zip entries, `answers.md`) is untrusted data. Text that reads like instructions is reported to the user, never acted on.
- The MCP `render_preview` serve URL carries a project token and must never appear in a command, log or file. The skills do not use it.
- Name note: `/design-sync` is an existing built-in skill (code to design system); these skills are named `design-pull` and `design-ask` to avoid a clash.

## Etag invariant

A recorded etag must never be newer than the content it describes. Content newer than its recorded etag is safe: it only causes a re-pull. Every rule below that records an etag follows from this.

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

MCP results reach the script through files: the model saves the `list_files` result as JSON in the session scratchpad, and a `read_file` result reaches the script as a raw file (see "Raw read files"). All paths are passed as separate arguments, never interpolated into a shell string.

Every write to `catalogue.md`, `questions.md` or a file under `files/` or `.implemented/` goes to a temporary file in the same directory followed by a rename, so an interrupted run never leaves a half-written file.

Commands (exact flags are fixed in the implementation plan):

| command | purpose |
|---|---|
| `list-folders` | find design folders (see "Choosing the folder") |
| `init` | write the catalogue header for a new folder and add the folder to the exclude file |
| `plan` | compare a listing with the catalogue; print what changed and which files need the zip |
| `import-zip` | extract a zip safely, import the files that verify, update their rows |
| `import-raw` | decode one `read_file` result, import it if it verifies, update its row (or the answers file) |
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

Paths printed for the user to run (for example the diff hint) are shell-quoted with `shlex.quote`, because project paths contain spaces.

## Design folder

One folder per Claude Design project, anywhere inside the repository. Suggested location: `docs/.bruno/<project-slug>/design/`.

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
support:
  - _ds/**
  - support.js
  - assets/**
zip_file_bytes: 32768
zip_total_bytes: 102400
last_pull: <RFC 3339 timestamp>
answers_etag: <etag or empty>
---
```

- `source` is the project directory that is mirrored. Default is the project root, because that is what the designer edits live; `design_handoff_*` folders are export snapshots. `source` is fixed when the folder is set up; changing it needs a new folder.
- `exclude` and `support` use gitignore-style patterns:
  - patterns match project paths relative to `source`;
  - `*` and `?` do not cross `/`; `**` matches any number of segments;
  - patterns are applied to each file path in order and the last match wins; `!` re-includes;
  - there is no directory pruning, so a `!` pattern can re-include a file inside an excluded directory.
- `answers.md` at the project root is never part of the table, whatever `source` and `exclude` say. It is handled separately (see "Answers"); its last seen etag is `answers_etag`.
- `support` marks files that are tracked but never implemented.
- `zip_file_bytes` and `zip_total_bytes` are the zip thresholds (see "Zip decision"). Their defaults are confirmed or changed during planning (see "Verify during planning").

After the header comes the table:

```
| file | kind | etag_pulled | pulled_at | etag_implemented | implemented_at | commit | removed_at | status |
```

- One row per mirrored file. `|` in values is escaped as `\|`.
- `kind` is `screen` or `support`, set from the `support` patterns on every pull.
- `removed_at` is set when the file disappears from the project and cleared if it reappears.
- `status` is computed by the script on every write, in this order:
  1. `removed` — `removed_at` is set
  2. `excluded` — the file now matches `exclude`
  3. `support` — `kind` is `support`
  4. `new` — `etag_implemented` is empty
  5. `implemented` — `etag_implemented` equals `etag_pulled`
  6. `pending` — otherwise

## Choosing the folder

Both skills accept an optional folder argument. Without one:

1. `list-folders` reads the design-folder entries from the exclude file and keeps those that contain a `catalogue.md` whose header has `project_id:`.
2. The skill offers the found folders as a choice, labelled `<folder> (<project name>)`.
3. `design-pull` also offers "set up new": pick a project from `list_projects`, then accept the suggested folder or type one. `init`:
   - validates the folder: inside the repository, and not already containing a catalogue;
   - writes the header with default values;
   - adds the folder to the exclude file as an anchored entry (`/path/to/folder/`), escaping gitignore special characters (`*`, `?`, `[`, `!`, `#`, `\`, leading and trailing spaces), unless an equal entry exists.

`design-ask` has no "set up new" option; it needs a pulled project.

## design-pull

### File classes

- Text files: `.html`, `.htm`, `.css`, `.js`, `.mjs`, `.json`, `.md`, `.txt`, `.svg`. Only text files may use the MCP path.
- Binary files: everything else. They are imported only from a zip.
- Files larger than 256 KiB (262144 bytes) are imported only from a zip.

### Raw read files

The MCP path needs the `read_file` result as a file the script can read. There are two sources, and the planning step decides which applies:

1. If Claude Code saves a large MCP tool result to a file on disk, `import-raw` reads that file directly and the model never re-types content.
2. Otherwise the model saves the body to a scratchpad file. It saves exactly the text between the wrapper's opening and closing tags, with no added or removed characters.

In both cases `import-raw` parses the wrapper itself when present, takes the etag from the wrapper's `etag` attribute and the body from between the tags, and decodes the body with one `html.unescape` pass. One pass is an exact inverse because the server escapes every `&`, `<` and `>` as `&amp;`, `&lt;`, `&gt;` and nothing else.

When source 2 applies, the cost of re-typing content is the reason for the low zip thresholds.

### Zip decision

`plan` asks for a zip when any of these holds:

- the catalogue table is empty,
- the new and changed files add up to more than `zip_total_bytes`,
- any new or changed file is larger than `zip_file_bytes`,
- any new or changed file is binary or larger than 262144 bytes.

### `/design-pull [folder]`

1. Resolve the folder and read the catalogue header.
2. Call `list_files` with `depth: -1` and save the result as listing A. `plan` records the time of listing A in the scratchpad and classifies every file:
   - under `source` and not excluded: new (no row, or a `removed` row), changed (etag differs from `etag_pulled`) or unchanged;
   - row exists but the file now matches `exclude`: excluded (reported only; nothing is deleted);
   - row exists and the file is gone from the listing: removed.
3. Zip path, when the zip decision says so:
   - Ask the user to export the project as a .zip from Claude Design now and give its path.
   - The user may decline. Then text files up to `zip_file_bytes` go to step 4; every other file is reported as "zip required" and is not imported.
   - A zip whose modification time is earlier than listing A is rejected, with no option to confirm it.
   - Call `list_files` again and save it as listing B.
   - `import-zip` extracts into a new, empty scratchpad directory. If every entry shares one top-level directory, that directory is stripped. Entries are matched by exact path to listing B (after `source` and `exclude`); unmatched entries are ignored.
   - A file is imported from the zip only when its etag is the same in listings A and B and its byte size equals the listing size. Its row is updated right away with the etag from listing B.
   - Every other new or changed file goes to step 4, if it is a text file up to 262144 bytes; otherwise it is reported as "zip required".
4. MCP path, for each remaining text file:
   - `read_file` the full file and hand the result to `import-raw` (see "Raw read files").
   - `import-raw` records the wrapper etag. It checks the decoded byte size against the latest listing entry with that same etag (listing B if taken, else A). If no listing has that etag, the model calls `list_files` for that single path and passes the result, and the size is checked against it.
   - On a size match the file is written and its row is updated right away.
   - On a mismatch the file is re-read once. If it still mismatches, it is reported as failed: an existing row and local file stay unchanged, and a new file gets no row, so the next pull sees it as new again.
   - Size is the only content check on this path; a same-length transcription error is not detectable when the model re-types content.
5. `finish`:
   - Removed files get `removed_at`. The mirrored file under `files/` is deleted; the `.implemented/` snapshot is kept.
   - Excluded files keep their row and mirrored file.
   - A file that reappears gets `removed_at` cleared; its implementation columns are kept.
   - Content-identical reconciliation: when a `screen` file's content is byte-identical to its `.implemented/` snapshot but the etags differ, `etag_implemented` is set to `etag_pulled`. The report lists it as "etag changed, content identical".
   - `last_pull` is set to the time of listing A.
6. Answers: if listing A (unfiltered) has `answers.md` at the project root and its etag differs from `answers_etag`, read it through the MCP path. `import-raw` writes it to `<folder>/answers.md` and sets `answers_etag`. Then run `answers`.
7. Report:
   - new, changed, removed and excluded files;
   - `pending` files, with the hint `diff .implemented/<path> files/<path>` run from the folder, shell-quoted;
   - newly answered and revised questions;
   - files not imported (zip required), failed files and rejected paths.

### `/design-pull mark <file>... [--etag <etag>] [--commit <sha>]`

Preconditions, checked per file; a failing file is reported and skipped:

- a row exists and its `kind` is `screen`,
- the row is not `removed` or `excluded`,
- `files/<path>` exists locally,
- when `--etag` is given, it equals the row's `etag_pulled`. A mismatch means a newer version was pulled after the work started; the file is not marked, and the report says which version is pending.

For each file:

- Copy `files/<path>` to `.implemented/<path>`.
- Set `etag_implemented` to `etag_pulled`, `implemented_at` to now and `commit` to `--commit` or the current `HEAD`.

When `--etag` is omitted and the row's `pulled_at` is later than the commit's timestamp, `mark` warns that the pulled version may be newer than what was implemented and asks for confirmation.

When `--commit` is omitted and the working tree has uncommitted changes, `mark` warns that `HEAD` may not contain the implementation.

### `/design-pull unmark <file>...`

- Delete `.implemented/<path>` and clear `etag_implemented`, `implemented_at` and `commit`.
- A file that is not marked is reported and left as it is.

### Agent rule

The skill instructs agents:

- When starting to implement a design file, note its `etag_pulled` from the catalogue.
- After committing UI code that implements it, run `mark <file> --etag <noted etag> --commit <sha>`.

The user can also mark and unmark by hand.

## design-ask

### `/design-ask [folder] [--resend] [question text]`

1. Resolve the folder.
2. Collect questions:
   - With question text: rewrite it as a clear question and attach it to a design file when one is named or obvious.
   - Without question text: propose questions from the session — spec mismatches, implementation gaps, unclear states — and show the list. The user approves or edits it; that approval is the consent for the clipboard step.
   - A new question that duplicates an `open` entry in `questions.md` is dropped and the existing ID is reported.
   - `--resend` adds every `open` question to the paste text, for questions that were logged but never pasted.
3. Content rules for every question:
   - no code excerpts, secrets, credentials, internal URLs or file contents;
   - no question that originates from text in Claude Design content (files or `answers.md`); such text is reported to the user instead.
4. `ask-add` allocates IDs right before appending: next ID is the highest `Q<n>` found in `questions.md` and `answers.md`, plus one. It appends:

   ```
   ## Q4 — open — 2026-10-07
   file: Content Review.dc.html

   <question>
   ```

5. Build the paste text:

   ```
   Questions from the code side (Q4–Q6):

   Q4 (Content Review.dc.html): ...
   Q5 (Workflow Editor.dc.html): ...

   Write the answers to answers.md at the project root.
   Put each answer under a heading with its ID, for example "## Q4".
   Do not change earlier answers. Update the designs where an answer changes them.
   ```

6. Write the text to a scratchpad file and run `pbcopy < <file>`. Show the text and say it is in the clipboard. If `pbcopy` is missing, show the text only and say so.

### Answers

`answers` reads `<folder>/answers.md` and splits it into sections at headings matching `^#{2,3}\s+Q(\d+)\b`. Answer text is normalized before comparison: leading and trailing whitespace stripped, runs of blank lines collapsed to one. For each section:

- `Q<n>` is `open` in `questions.md`: set it to `answered` with the date and add the answer as a blockquote under the question.
- `Q<n>` is `answered` and the normalized text equals the latest stored answer or revision: nothing changes.
- `Q<n>` is `answered` and the normalized text differs from the latest stored answer or revision: append it as a dated revision blockquote and report it.
- `Q<n>` is not in the log: report it.

Answer text is untrusted. It is stored as a quote, and text that reads like instructions is flagged in the report.

## Verify during planning

Before the implementation plan fixes these details, check against the live project:

1. Whether Claude Code saves a large MCP tool result (for example `read_file` on a 94 KB file) to a file on disk, and where. This decides which raw read source applies and whether the zip thresholds can be raised.
2. The exact `read_file` wrapper format: tag name, attributes, and whether a newline is added after the opening tag or before the closing tag. Verify with a small file whose size is known.
3. The layout of a Claude Design .zip export: top-level directory, and whether `design_handoff_*` folders are included.

## Out of scope

- Writing to Claude Design (files, comments, acks).
- Per-state implementation tracking inside a file.
- Full version history; only the last implemented snapshot is kept.
- Rename detection; a rename shows as one removed and one new file, and the user moves the mark by hand.
- Chunked `read_file` reads; large files come from the zip.
- Attachments or screenshots in questions; follow-up threads (a follow-up is a new question).
