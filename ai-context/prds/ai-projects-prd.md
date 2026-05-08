# PRD: Projects for AI Power-Ups

---

## 1. Summary

Add a **Projects** concept to the AI Power-Ups settings group. A Project bundles reusable prompting context — instructions, default personas, and reference files from the DAM — that users can attach to a content generation request with one click. The goal is to eliminate the need to re-paste the same brand guidelines, glossaries, and style references into every prompt. Prompt construction is handled in `packages/ai-powerups/src/api/features/WbGeneratePageContent/WbGeneratePageContentUseCase.ts` 

Inspired by Anthropic's "Projects" concept in Claude.ai, scoped to our admin app's content generation flow.

## 2. Goals & Non-Goals

### Goals

- Let admins define reusable prompting contexts (instructions + files) once and reuse them across many generations.
- Reduce time-to-prompt for repeat generation tasks (brand pages, product pages, campaign content) by pre-loading context.
- Cut LLM cost and latency on repeat generations through Anthropic prompt caching.
- Keep the existing prompting UX (Image 2) lightweight — projects are an optional addition, not a required step.

### Non-Goals

- **No retrieval / embeddings / RAG.** Project files are sent in full to the LLM. We'll add chunked retrieval only if context limits become a real problem.
- **No project-level model or temperature overrides.** Generation settings remain global.
- **No project sharing/permissions UI.** Projects inherit the workspace scope of other AI Power-Ups settings.
- **No versioning or history on project edits.** Out of scope for v1.
- **No automatic file sync from external sources.** Files are picked from the DAM at edit time.

## 3. User Stories

- As an admin, I can create a project named "Acme Marketing Site" with brand guidelines, tone instructions, and three reference MDs from the DAM, so I don't have to re-paste them every time.
- As an admin, I can attach default reader and writer personas to a project so the persona pickers auto-populate when I select that project.
- As a content creator, when I open the Generate Content dialog (Image 2), I can optionally pick a project, see which files will be sent to the LLM, and toggle individual files off for this specific generation.
- As an admin, I can edit a project's instructions or files; the next generation reflects the changes immediately.
- As an admin, I can delete a project I no longer need.

## 4. Scope

This PRD covers three surfaces:

1. **Admin app — new "Projects" section** in AI Power-Ups settings (alongside Providers, Reader Personas, Writer Personas).
2. **User prompting flow** — new optional Project picker in the Generate Content dialog, with per-file toggles.
3. **Backend** — prompt construction, file loading from DAM, project context cache, and Anthropic prompt cache integration.

---

## 5. Admin App — Projects Settings

### 5.1 Navigation

Add **Projects** as a fourth item in the AI Power-Ups left nav (Image 1), below Writer Personas:

```
Providers
Reader Personas
Writer Personas
Projects                    ← new
  Predefined prompting contexts.
```

### 5.2 Projects list view

Mirrors the persona list pattern:

- Collapsible cards showing project name as title.
- Reorder (↑ ↓) and delete (🗑) actions per card, matching existing personas UI.
- "Add project" button below the list.
- Save Settings button preserved at the bottom of the panel.

When expanded, each card shows the edit form (5.3).

### 5.3 Project edit form

Fields:

| Field                  | Type                                  | Required | Notes                                                                    |
| ---------------------- | ------------------------------------- | -------- | ------------------------------------------------------------------------ |
| Name                   | Text input                            | ✅       | Shown in pickers.                                                        |
| Description            | Text input                            | —        | Human-facing; shown in project picker tooltip/subtitle. Not sent to LLM. |
| Instructions           | Textarea (resizable, ~6 rows default) | —        | The system-prompt-style guidance. Sent to LLM.                           |
| Default Reader Persona | Dropdown of existing reader personas  | —        | Optional.                                                                |
| Default Writer Persona | Dropdown of existing writer personas  | —        | Optional.                                                                |
| Files                  | DAM file picker + reorderable list    | —        | See 5.4.                                                                 |

### 5.4 Project files

A list of file references from the DAM. Use `MultiFilePicker` component to register a new `AdminConfig.Form.FieldRenderer` for the `file().list()` field.

**No `enabled` toggle at the project level.** Per-prompt exclusion is handled in the prompting flow (see §6.2).

### 5.5 Save behavior

- "Save Settings" button at the bottom of the panel (consistent with current AI Power-Ups behavior) saves all changes.
- On save, the backend bumps the project's `version` field and invalidates cached assembled context for that project (see §7.3).

---

## 6. User Prompting Flow

### 6.1 Generate Content dialog additions

Extend the existing dialog (Image 2). New field, placed **above** Reader Persona:

```
Project (optional)
Select a predefined context to attach.
[ Select a project ▾ ]
```

When a project is selected:

1. **Reader Persona** and **Writer Persona** dropdowns auto-populate with the project's defaults (if set). User can still change them — selection in the dropdown overrides project defaults for this generation only.
2. A new **Project files** section appears below the persona pickers and above the Prompt textarea (see 6.2).

When no project is selected: dialog behaves exactly as today.

### 6.2 Project files section (visible only when a project is selected)

Header: **Files included**

Below the header, a list of the project's files. Each row:

- Checkbox (default: checked)
- File label (or DAM file name if no label)
- Small file type icon

Footer text: _"Uncheck files to exclude them from this generation only. To permanently change project files, edit the project."_

The state of these checkboxes is **session-local** — it doesn't mutate the project. A `excludedFileIds: string[]` array is included in the generation request payload.

### 6.3 Prompt field

Unchanged from current implementation. Required, free-form textarea.

### 6.4 Generate button

Unchanged. Submits the request with new optional fields:

```ts
{
  userPrompt: string;
  readerPersonaId: string;
  writerPersonaId: string;
  projectId?: string;          // new
  excludedFileIds?: string[];  // new, only meaningful if projectId set
}
```

---

## 7. Backend

### 7.1 Data model

```ts
interface Project {
  id: string;
  workspaceId: string;
  name: string;
  description?: string;
  instructions: string;
  defaultReaderPersonaId?: string;
  defaultWriterPersonaId?: string;
  files: ProjectFile[];
  version: number; // bumps on every save; used as cache key suffix
  createdAt: Date;
  updatedAt: Date;
}

interface ProjectFile {
  id: string;
  damFileId: string;
  label?: string;
  note?: string;
  position: number;
}
```

### 7.2 Prompt construction pipeline

When a generation request arrives with a `projectId`:

1. **Load AiPowerUpsSettings**
2. **Get assembled project context** from cache (see 7.3). Cache miss → assemble from DAM, store, return.
3. **Filter excluded files** in memory based on `excludedFileIds` from the request.
4. **Compose final messages**:
   - System message contains: project instructions + included files (formatted with label/note headers) + persona system prompts.
   - User message contains: the user's prompt.
5. **Mark system block as cacheable** via Anthropic provider options (`cacheControl: { type: "ephemeral" }`).
6. **Send to LLM** via AI SDK.

Pseudocode:

```ts
async function buildPrompt(req: GenerationRequest): Promise<MessageBundle> {
  const personas = await loadPersonas(req.readerPersonaId, req.writerPersonaId);

  let projectBlock = "";
  if (req.projectId) {
    const project = await loadProject(req.projectId);
    const ctx = await getAssembledProjectContext(project); // see 7.3
    const includedFiles = ctx.files.filter(f => !req.excludedFileIds?.includes(f.id));
    projectBlock = formatProjectBlock(ctx.instructions, includedFiles);
  }

  return {
    system: [
      {
        type: "text",
        text: `${personas.systemPrompt}\n\n${projectBlock}`.trim(),
        providerOptions: {
          anthropic: { cacheControl: { type: "ephemeral" } }
        }
      }
    ],
    userPrompt: req.userPrompt
  };
}
```

### 7.3 Project context cache

**Purpose:** avoid re-fetching from S3 and re-extracting text from PDFs/docx on every request.

**Store:** KeyValueStore (existing infrastructure).

**Key format:** `project-context:{projectId}:v{version}`

**Value:** gzipped JSON:

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
    content: string; // extracted text content
  }>;
  assembledAt: string; // ISO timestamp
}
```

**TTL:** 30 days (sliding). Old versions naturally age out.

#### Cache lookup flow

```
1. Compute key: `project-context:${projectId}:v${project.version}`
2. KV.get(key)
   ├── hit  → gunzip, parse JSON, return
   └── miss → assemble (7.4), gzip, KV.put, return
```

#### Cache invalidation

When settings are saved, increment `Project.version` if project data changes. This can be done in ProjectGroupHandler implementation. This means the next request computes a different cache key and falls through to a fresh assembly.

**Why version-bump instead of content-hash?**

- **Simpler.** No hashing logic; no risk of accidentally hashing in flapping fields like `updatedAt`.
- **Predictable.** Devs and ops can read the version in logs and reason about cache state.
- **Old cache entries clean up themselves** via TTL — no manual cleanup job needed.


### 7.4 Assembly logic (cache miss path)

For each `ProjectFile` in the project, in `position` order:

1. Resolve the DAM file → S3 key + content type.
2. Fetch from S3 in parallel (`Promise.all`).
3. We only support MD,MDX,TXT,JSON,CSV files for now - all easy to read as text
4. Store the extracted string in the assembled context record alongside metadata.

### 7.5 Final prompt format

The system message project block format (sent to LLM):

```
## Project: {project.name}

{project.instructions}

### Reference files

--- {file1.label or file1.damFileName} ---
{file1.note ? "Note: " + file1.note + "\n" : ""}
{file1.content}

--- {file2.label or file2.damFileName} ---
{file2.content}

[...]
```

Order: instructions first, then files in `position` order. **Stable bytes are critical** for prompt caching to hit.

### 7.6 Token budget

- Soft cap on assembled project context: **150k tokens** (well below Claude's 200k context, leaving room for personas + user prompt + completion).
- Validation runs at project save time — if assembled size exceeds cap, return a 400 to the admin UI with a clear error indicating which files contribute the most. Validation is added to zod schema of the ProjectGroupHandler.
- Re-validation runs lazily on cache miss (catches cases where DAM file content changed in place).

### 7.7 Anthropic prompt cache

- Mark the entire system block (personas + project block) with `cache_control: { type: "ephemeral" }`.
- Order matters for prefix-based caching:
  1. Persona system prompt
  2. Project instructions
  3. Project files
  4. User prompt (in user message — never cached)
- This produces strong cache hits when:
  - Same project + same personas + no file exclusions → identical prefix → cache hit.
  - Same project + same personas + same exclusion set within 5 min → cache hit.
- Cache miss is graceful: full request just costs normal token rate.

---

### 7.8

Upgrade `packages/api-core/src/features/keyValueStore/abstractions.ts` to support `expiresAt: Date` in options, for both KeyValueStore and GlobalKeyValueStore.

Validation: if `excludedFileIds` is set, `projectId` must be set. If `projectId` is set, all `excludedFileIds` must reference files actually in that project.
