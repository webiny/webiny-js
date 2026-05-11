# Plan: Projects for AI Power-Ups

> Source PRD: `ai-context/prds/ai-projects-prd.md`

## Architectural decisions

Durable decisions that apply across all phases:

- **Data model**: Projects live inside `IAiPowerUpsSettings` as a `projects: { presets: Project[] }` section, following the same settings group pattern as WriterPersonas/ReaderPersonas. Each project has an `id`, `name`, `description`, `instructions`, `defaultReaderPersonaId`, `defaultWriterPersonaId`, `files: ProjectFile[]`, and `version: number`.
- **Settings group pattern**: Admin side implements `AiPowerUpsSettingsGroup.Interface` (form definition). API side implements `AiPowerUpsSettingsGroupHandler.Interface` (Zod validation, mapFromStorage/mapToStorage). Registration via feature files in admin and api Extension.
- **Project context cache key**: `project-context:{projectId}:v{version}` in GlobalKeyValueStore with `expiresAt` TTL (30 days).
- **Prompt ordering** (for prefix-based Anthropic prompt caching): persona system prompt → project instructions → project files → component catalog → tools → user prompt.
- **ID-based references**: `projectId`, `readerPersonaId`, `writerPersonaId` are passed as string IDs from admin to API. Backend resolves full objects from settings.
- **File content support**: MD, MDX, TXT, JSON, CSV only (text-readable formats). Files loaded from S3 via DAM file key.

---

NOTE: when a phase is complete, mark it as "done" in the list below.

## [x] Phase 1: Projects CRUD in Settings

**User stories**: Create a project, edit a project's name/description/instructions/default personas, delete a project.

### What to build

A new "Projects" settings group that appears as a fourth tab in AI Power-Ups settings (below Writer Personas). Users can add/edit/remove project presets with name, description, instructions textarea, and default reader/writer persona dropdowns. No file support yet.

The admin side defines the form using the settings group builder pattern (`objectAccordionMultiple` renderer with `list()`). The API side adds a handler with Zod validation, type augmentation on `IAiPowerUpsSettings`, and feature registration. Default persona dropdowns use `.options()` callbacks that read from the same settings object's persona presets.

### Acceptance criteria

- [ ] "Projects" tab appears in AI Power-Ups settings page
- [ ] Can add a new project with name (required), description, instructions, default reader persona, default writer persona
- [ ] Can edit and delete existing projects
- [ ] Projects persist across page reloads (saved to KeyValueStore via settings)
- [ ] Default persona dropdowns show existing reader/writer persona presets
- [ ] Zod validation rejects projects without a name
- [ ] Admin `IAiPowerUpsSettings` type augmented with `projects` section

---

## [x] Phase 2: Project Files (DAM Integration)

**User stories**: Attach reference files from the DAM to a project.

### What to build

Add a "Files" field to the project edit form that lets admins pick files from the DAM. Uses a `file().list()` field with a custom renderer backed by `MultiFilePicker`. Each file reference stores `FileItem` object. Ortder of files is index-based.

Only file metadata is stored in settings — no file content loading happens in this phase.

### Acceptance criteria

- [ ] Project edit form includes a "Files" section with DAM file picker
- [ ] Can add multiple files from the DAM to a project
- [ ] Can remove files from a project
- [ ] File metadata persist with the project
- [ ] Files display with their DAM name in the project form

---

## [x] Phase 3: Project Picker in Generate Content Dialog

**User stories**: Pick a project in the Generate Content dialog; default personas auto-populate.

### What to build

Add a "Project" select field to the Generate Content dialog form, placed above the persona selects. When a project is selected, auto-populate the reader/writer persona fields with the project's defaults (user can still override). Pass `projectId` through the full chain: admin form → gateway GraphQL mutation → API task input → use case → prompt builder. Backend resolves the project from settings and appends project instructions to the system prompt.

No file content loading — only the project's `instructions` field is used in prompt construction.

### Acceptance criteria

- [ ] "Project" dropdown appears in Generate Content dialog above persona selects
- [ ] Dropdown lists all configured projects by name
- [ ] Selecting a project auto-fills reader/writer persona dropdowns with project defaults
- [ ] User can override auto-filled personas
- [ ] `projectId` flows through GraphQL mutation, task input, and use case params
- [ ] Backend resolves project from settings and appends instructions to system prompt
- [ ] Generation works correctly without a project selected (backward compatible)

---

## [x] Phase 4: File Content Loading + Prompt Assembly

**User stories**: Project files are sent to the LLM; per-file toggle in dialog.

### What to build

Two pieces: (1) Backend file content loading — when a project is selected and has files, load each file's content from S3 via the DAM file key, then assemble into the system prompt using the format from PRD §7.5. (2) Dialog UI — when a project is selected, show a "Files included" section with checkboxes for each file. Unchecked files are passed as `excludedFileIds` through the full chain.

Supported formats: MD, MDX, TXT, JSON, CSV (read as text). The use case filters out excluded files before assembling the prompt.

### Acceptance criteria

- [ ] When a project with files is used for generation, file contents appear in the system prompt
- [ ] File content is loaded from S3 using DAM file metadata (key)
- [ ] Prompt format matches PRD §7.5 (project name, instructions, then files with labels/notes)
- [ ] Dialog shows "Files included" section with per-file checkboxes when project is selected
- [ ] Unchecked files are excluded from generation (excludedFileIds param)
- [ ] `excludedFileIds` flows through GraphQL mutation, task input, and use case
- [ ] Unsupported file types are silently skipped
- [ ] Generation still works if project has no files

---

## [x] Phase 5: Project Context Cache

**User stories**: Performance optimization — avoid re-fetching files from S3 on every generation.

### What to build

Three pieces: (1) Upgrade KeyValueStore abstraction (§7.8) to support `expiresAt: Date` in options for both `KeyValueStore` and `GlobalKeyValueStore`. Update the DynamoDB implementation to store and check expiration. (2) Build project context cache — on generation, check cache by `project-context:{projectId}:v{version}` key. On miss, assemble from S3, gzip, store with 30-day TTL. On hit, decompress and use. (3) Version bumping — when settings are saved and project data changed, increment the project's `version` field in the handler's `mapToStorage`.

### Acceptance criteria

- [ ] KeyValueStore abstraction supports `expiresAt: Date` option
- [ ] DynamoDB implementation stores and respects expiration
- [ ] Assembled project context is cached with version-keyed entries
- [ ] Cache hit avoids S3 reads
- [ ] Editing a project bumps `version`, causing cache miss on next generation
- [ ] Cache entries expire after 30 days via TTL

---

## [x] Phase 6: Anthropic Prompt Cache + Token Budget

**User stories**: Cost/latency optimization via Anthropic prompt caching; token budget guardrails.

### What to build

Two pieces: (1) Mark the entire system block (personas + project block) with `cacheControl: { type: "ephemeral" }` via Anthropic provider options. Ensure prompt ordering is stable (persona → project instructions → project files → catalog → tools) for maximum prefix cache hits. (2) Token budget validation — at project save time, estimate assembled context size and reject if it exceeds 150k tokens with a clear error indicating which files are largest.

### Acceptance criteria

- [ ] System prompt block includes `providerOptions.anthropic.cacheControl` marking
- [ ] Prompt ordering is stable and cache-friendly
- [ ] Repeat generations with same project + personas hit Anthropic's prompt cache
- [ ] Saving a project with assembled context exceeding 150k tokens shows a validation error
- [ ] Validation error identifies the largest files contributing to the budget overage
