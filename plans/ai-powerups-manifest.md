# Plan: Manifest-Based Project Context for AI Power-Ups

> Source PRD: `ai-context/prds/ai-powerups-manifest.md`

## Architectural decisions

Durable decisions that apply across all phases:

- **Cache key**: `AiProjectContext/{projectId}/v{version}` — unchanged from current implementation. Version increments on project save; old entries age out via 30-day TTL.
- **Cache format**: `AssembledProjectContext` blob stored gzip+base64 in `GlobalKeyValueStore`. Enriched with `damDescription`, `tokenCount`, `label`, `note`, `totalTokens`.
- **Manifest format**: YAML-like block in system message listing file metadata (id, label, description, note, tokens). Model reads files on demand via tool.
- **Tool name**: `read_project_file` — registered as an `AiSdkTool` implementation, auto-discovered by `AiSdkTools` aggregator.
- **Tool reads from cache**: Tool calls resolve from the same KV-cached `AssembledProjectContext`, no extra S3 fetches per tool call.
- **Websocket telemetry**: Generation telemetry (files_read, cache_hit, tool_calls_made) added to the success websocket message alongside the compressed content.
- **System message ordering** (for Anthropic prompt cache stability): Persona prompt → Project instructions → File manifest → Tool definitions.

---

## Phase 1: Enrich `AssembledProjectContext` with file metadata

**User stories**: PRD §3.1 (data model), §4 (assembly pipeline)

### What to build

Extend the cached `AssembledProjectContext` to carry per-file metadata needed by the manifest: DAM description, token count, label, note. Compute `totalTokens` as a summary field.

During assembly (cache miss path), for each project file:

- Fetch the DAM file record to get `description` (the DAM description populated by the file manager — including the frontmatter extraction we just built).
- Compute `tokenCount` from extracted text length (approximate: `Math.ceil(chars / 4)`).
- Carry through `label` and `note` from `ProjectFile` settings if present.

The `ProjectFileContent` interface gains new optional fields. The `ResolvedProject` type gains `totalTokens`. The `ProjectSection` formatter continues to inline content for now — Phase 2 switches it to manifest format.

If DAM description fetch fails for a file, continue with `damDescription: undefined`. Don't fail the whole assembly.

### Acceptance criteria

- [x] `ProjectFileContent` includes `damDescription`, `tokenCount` fields (label/note deferred — not in data model yet)
- [x] `ResolvedProject` includes `totalTokens` (sum of all file token counts)
- [x] Assembly pipeline fetches DAM description for each file (via `GetFileUseCase`)
- [x] Token count approximated from text length (`Math.ceil(chars / 4)`)
- [x] DAM fetch failure for one file does not break assembly — warning logged, description remains undefined
- [x] Cached blob includes the new fields; cache key/TTL unchanged
- [x] Existing generation flow still works (ProjectSection still inlines content)
- [x] Type checks pass for `ai-powerups` package

---

## Phase 2: Manifest system message + `read_project_file` tool

**User stories**: PRD §5 (manifest format), §6 (tool definition & implementation), §6.3 (excluded files), §7 (prompt caching)

### What to build

Replace the inline file content approach with a manifest + on-demand tool.

**Manifest formatting**: Replace `ProjectSection.format()` to emit the YAML-like manifest block instead of raw file content. The manifest lists each file's id, label, description, note (if present), and approximate token count. Includes the instruction: "Use the `read_project_file` tool to read any file when its contents are relevant. Read files only when needed — do not read all files preemptively."

**`read_project_file` tool**: Implement as an `AiSdkTool` in the `ai-powerups` package. The tool:

- Accepts `{ file_id: string }`.
- Looks up the file in the cached `AssembledProjectContext` (already loaded during context building).
- Returns `{ content, label, note }` on success.
- Returns an error string with available file IDs if the file is not found.
- Returns "File excluded for this generation" if the file was excluded.

The tool needs access to the assembled context for the current generation. Since context is built per-request in `AiPromptContextBuilder`, the tool implementation receives the resolved context (or a lookup function) rather than re-fetching from KV.

**Excluded files**: Dropped from the manifest entirely. Tool refuses to serve them even if the model guesses the ID.

**`AiPromptContext` changes**: The context object now carries the manifest string (for the system message) and the file lookup data (for the tool). The `files` array on `ResolvedProject` no longer needs full `content` in the system message — content is served only through the tool.

### Acceptance criteria

- [x] System message contains YAML-like manifest instead of inline file content
- [x] Manifest includes id, name, description, tokens for each non-excluded file
- [x] `read_project_file` tool created per-request via `createReadProjectFileTool()` and merged into `sdkTools`
- [x] Tool returns file content from cached context (no extra S3 call)
- [x] Tool returns error with available IDs for unknown file_id
- [x] Tool refuses excluded files with "File excluded for this generation."
- [x] Excluded files do not appear in manifest (`resolvedProject.files` is pre-filtered)
- [x] System message ordering: personas → project instructions → manifest → tools (cache-stable)
- [x] Existing `stepCountIs(10)` round cap applies to tool-use rounds
- [x] Type checks pass for `ai-powerups` package

---

## Phase 3: Telemetry in websocket response + error hardening

**User stories**: PRD §9 (error handling), §10.4 (generation telemetry)

### What to build

**Websocket telemetry**: Extend the success websocket message to include generation telemetry alongside the compressed content. The `data` payload gains a `telemetry` field:

```
{
  action: "aiPowerUps.generatePageContent.content",
  data: {
    compression: "gzip",
    value: "...",
    telemetry: {
      filesRead: string[],       // IDs of files the model requested via tool
      cacheHit: boolean,         // Whether project context was served from KV cache
      toolCallsMade: number,     // Total tool invocations across all steps
      totalSteps: number         // Number of AI SDK steps in the generation
    }
  }
}
```

This data is collected during generation: `AiPromptContextBuilder` reports cache hit/miss; the `read_project_file` tool tracks which files were read; `ai.generateText` result exposes step count and tool calls.

**Error hardening**:

- Unknown `file_id` in tool call → return error string listing valid IDs (already in Phase 2, verify edge cases).
- Excluded file tool call → return "File excluded for this generation" (already in Phase 2, verify).
- DAM description fetch failure → `"(no description)"` in manifest (already in Phase 1, verify).
- Log warnings for: cache miss rebuilds, file load failures, tool round cap reached.

### Acceptance criteria

- [x] Success websocket message includes `telemetry` field with `filesRead`, `cacheHit`, `toolCallsMade`, `totalSteps`
- [x] Telemetry reflects actual generation behavior (extracted from `aiResult.steps` tool calls)
- [x] Client can log/display telemetry from websocket payload
- [x] Error strings from tool are model-friendly (include available file IDs) — implemented in Phase 2
- [x] Warnings logged server-side for cache rebuilds, file failures — via `console.warn` in builder
- [x] Type checks pass for `ai-powerups` package
