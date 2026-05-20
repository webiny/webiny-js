# PRD Addendum: Manifest-Based Project Context

**Status:** Draft (revised)
**Owner:** TBD
**Audience:** Engineering team
**Builds on:** PRD: Projects for AI Power-Ups
**Last updated:** 2026-05-11
**Supersedes:** Earlier dual-mode (inline vs. manifest) draft of this addendum

---

This is an addendum to the [Projects PRD](./ai-projects-prd.md).

## 1. Summary

The base Projects PRD assumes all project files are inlined into the system message. This works for small projects but doesn't scale to projects with 20+ files, and pays for tokens the model doesn't actually need on a given generation.

This addendum replaces the inline approach with a single **manifest-based strategy** for all projects, regardless of size:

- The system message contains the project instructions plus a **manifest** of file metadata (label, DAM description, optional note, approximate token count).
- A `read_project_file` tool lets the model fetch the full text of any listed file on demand.
- File contents are pre-extracted and cached, so tool calls return synchronously from KV without re-hitting S3.

This trades a small amount of latency (one extra round trip when the model decides to read files) for a much simpler architecture, smaller request payloads, and per-generation token costs that scale with actual file usage rather than project size.

## 2. Goals & Non-Goals

### Goals

- Support projects of any size (1 file or 50+) with a single code path.
- Keep file-fetch latency low by serving tool calls from a pre-extracted cache.
- Reuse existing infrastructure: KV store, DAM, AI SDK tools.
- Keep admin UX unchanged — no new fields, no mode switches.

### Non-Goals

- **No retrieval / embeddings / RAG.** Whole-file fetch via tool is the upper bound for this iteration.
- **No inline fallback for small projects.** One code path, regardless of project size.
- **No per-file admin summary field.** Descriptions come from the DAM.
- **No partial-file reads / pagination.** Tool returns the full file content.

---

## 3. Data Model

### 3.1 `AssembledProjectContext` (cached blob)

```ts
interface AssembledProjectContext {
  projectId: string;
  version: number;
  instructions: string;
  files: Array<{
    id: string; // ProjectFile.id
    damFileId: string;
    label?: string;
    note?: string;
    damDescription?: string; // pulled from DAM at assembly time
    content: string; // extracted text
    tokenCount: number; // for manifest display & admin UI
  }>;
  totalTokens: number;
  assembledAt: string;
}
```

Stored in KV under `project-context:{projectId}:v{version}`, gzipped, TTL 30 days.

### 3.2 `Project` and `ProjectFile` — unchanged

No schema changes from the base PRD. Descriptions live in the DAM and are fetched at assembly time, not stored on `ProjectFile`.

---

## 4. Assembly Pipeline

### 4.1 Cache miss path

```
1. Load project row from DB.
2. For each ProjectFile (in parallel):
   a. Fetch DAM record (id, S3 key, content type, description).
   b. Fetch file bytes from S3.
   c. Extract text per content type (existing logic from base PRD §7.4).
   d. Tokenize → tokenCount.
3. Build AssembledProjectContext.
4. Gzip + store in KV under project-context:{id}:v{version}.
5. Return.
```

### 4.2 Cache hit path

```
1. Compute cache key from projectId + project.version.
2. KV.get → gunzip → parse.
3. Filter excluded files (excludedFileIds from request).
4. Build system message (manifest) + tool definition.
5. Return.
```

### 4.3 Invalidation

Unchanged from base PRD: `Project.version` increments atomically on every save; cache lookup uses the new version, old entries age out via TTL.

---

## 5. Manifest Format

The system message contains the project instructions followed by the file manifest:

```
## Project: {project.name}

{project.instructions}

### Available reference files

You have access to {N} reference files for this project. Use the
`read_project_file` tool to read any file when its contents are relevant
to the user's request. Read files only when needed — do not read all files
preemptively.

Files:

- id: "{file.id}"
  label: "{file.label || damFileName}"
  description: "{file.damDescription || '(no description)'}"
  note: "{file.note}"          (only included if present)
  tokens: ~{file.tokenCount}

- id: "{file2.id}"
  [...]
```

Design choices:

- **YAML-like format** is compact and reads cleanly. Models parse it reliably.
- **Explicit "do not read all files preemptively"** discourages blind fetching, which would defeat the architecture's purpose.
- **Token counts shown** so the model can prefer smaller files when multiple seem relevant.
- **`note` from `ProjectFile`** is the admin's per-file hint about _how_ to use the file, separate from the DAM's _what_ description.

---

## 6. Tool Definition & Implementation

### 6.1 Tool definition

```ts
{
  name: "read_project_file",
  description: "Read the full contents of a project reference file by its id. Use this when a file from the manifest contains information relevant to the user's request.",
  input_schema: {
    type: "object",
    properties: {
      file_id: {
        type: "string",
        description: "The id of the file from the project manifest."
      }
    },
    required: ["file_id"]
  }
}
```

Exposed via the AI SDK's standard tools parameter. Anthropic's parallel tool use is enabled — the model can request multiple files in a single turn, and we fulfill them concurrently from the same cached context.

### 6.2 Tool implementation

```ts
async function readProjectFile({
  fileId,
  projectId,
  excludedFileIds
}: ToolInput): Promise<ToolResult> {
  const ctx = await getAssembledProjectContext(projectId);

  if (excludedFileIds?.includes(fileId)) {
    return { error: "File excluded for this generation." };
  }

  const file = ctx.files.find(f => f.id === fileId);
  if (!file) {
    return {
      error: `File not found. Available ids: ${ctx.files.map(f => f.id).join(", ")}`
    };
  }

  return {
    content: file.content,
    label: file.label,
    note: file.note
  };
}
```

Notes:

- Reads from the same KV-cached context — no extra S3 fetches per tool call.
- Errors are returned as tool results, not exceptions — the model can recover (e.g., try a different file).
- The full file content is returned. No partial reads or pagination in v1.

### 6.3 Excluded files

When the user excludes files via the prompting UI (base PRD §6.2):

- Excluded files are dropped from the manifest.
- The tool refuses to read them even if the model guesses the id.

The model never sees that excluded files exist.

---

## 7. Prompt Caching

The system block (instructions + manifest + tool definitions) is marked `cache_control: { type: "ephemeral" }`. It's stable across generations for the same project version and exclusion set, so cache hit rates stay high on the prefix.

**Tool results are not part of the cacheable prefix** for future generations. Each generation pays for the files the model actually fetched, in input tokens, for that conversation only.

System block ordering for cache stability:

```
1. Persona system prompt
2. Project instructions
3. Manifest (files listed in stable position order)
4. Tool definitions
```

User prompt and tool results follow in user/assistant turns and don't affect the cacheable prefix.

---

## 8. Admin UX

No new fields on the project form.

**One small addition** below the file list:

```
Project size: ~64,200 tokens
```

Computed from the cached `totalTokens`. On first save (no cache yet), show "Calculating…".

**Per-file token count** (optional): show `~12K tokens` next to each file in the list. Falls out of the same cached data and helps admins see which file is dominating budget.

---

## 9. Error Handling

| Scenario                                                                 | Behavior                                                                            |
| ------------------------------------------------------------------------ | ----------------------------------------------------------------------------------- |
| Tool call references unknown `file_id`                                   | Return error string with valid ids. Model can retry.                                |
| Tool call references excluded file                                       | Return "excluded for this generation". Model treats as unavailable.                 |
| DAM description fetch fails for a file                                   | Continue assembly; manifest shows "(no description)". Don't fail the whole project. |
| Project file budget exceeded at project save                             | Existing behavior (base PRD §7.6) — show error with biggest files.                  |
| Model exhausts conversation turns reading files without producing output | Surface as generation timeout to client. Tool-use rounds capped at 10.              |

---

## 10. Open Questions

1. **Tool-use round cap.** Cap at 10 rounds per generation? Argues for: prevents runaway costs and latency. Argues against: legitimate use cases may need more. **Recommendation:** cap at 10, log when hit, revisit if it bites users.
2. **Manifest size at extreme file counts.** At 100+ files, the manifest itself starts to be large (~150 tokens/file metadata). Probably fine through 200 files; beyond that, grouping or summarization in the manifest may be needed. Not a v1 problem.
3. **DAM description quality.** Manifest quality depends entirely on DAM descriptions being useful. If admins routinely upload files without descriptions, the model has nothing to go on when deciding what to read. Worth measuring after launch — and possibly nudging admins via UI when a project has files with empty descriptions.
4. **Generation telemetry.** Log tool_calls_made, files_read, cache_hit per generation. Helps validate the architecture and tune later.

---

## 11. Out of Scope (Future)

- Pre-warming the cache after a project save (instead of lazy on first generation).
