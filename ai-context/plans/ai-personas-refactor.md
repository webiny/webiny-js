# Architectural Refactor Plan — `feat/ai-personas` Branch

## Context

The `feat/ai-personas` branch introduces AI Projects, Reader/Writer Personas, and enhanced content generation. While the features work, several architectural violations emerged during rapid development: direct S3 usage bypassing DI, near-total code duplication between persona types, growing use-case responsibilities, hardcoded configuration, and silent error swallowing throughout. This plan addresses each with concrete, non-breaking refactors.

---

## Item 1: Extract `GetFileContentsUseCase` — eliminate direct S3 from `ai-powerups` (P0, Size: L)

**Problem**: `loadProjectFiles.ts` directly instantiates `new S3()`, reads `process.env.S3_BUCKET`, and reaches into FileManager's internal KV structure (`FileManager/File/${id}/Metadata`). It's a pure function that can't participate in DI, mixing S3 fetching, KV caching, MIME filtering, and metadata lookup.

**What to do**:

1. **`packages/api-file-manager`** — define the abstraction:
   - Create `src/features/file/GetFileContents/abstractions.ts`
   - `GetFileContentsUseCase` with `execute(fileId: string): Promise<Result<{ buffer: Buffer; contentType: string }, Error>>`
   - Export from package index

2. **`packages/api-file-manager-s3`** — implement:
   - Create `src/features/GetFileContents/GetFileContentsUseCaseImpl.ts`
   - Inject `GlobalKeyValueStore` (for `MetadataReader` pattern already used in this package) and S3 client
   - Read `process.env.S3_BUCKET` (established convention in this package)
   - Register in the S3 feature

3. **`packages/ai-powerups`** — consume:
   - Convert `loadProjectFiles.ts` into an injectable `ProjectFileLoader` class
   - `ProjectFileLoader` injects `GetFileContentsUseCase` and `GlobalKeyValueStore`
   - MIME filtering and project-context caching stay here (ai-powerups concerns)
   - `WbGeneratePageContentUseCase` injects `ProjectFileLoader` instead of calling the free function

**Key files**:

- `packages/ai-powerups/src/api/features/WbGeneratePageContent/loadProjectFiles.ts` (replace)
- `packages/api-file-manager/src/features/file/GetFileContents/` (new)
- `packages/api-file-manager-s3/src/features/GetFileContents/` (new)

**Dependencies**: None. Foundation for Items 4 and 5.

---

## Item 2: Unify Reader/Writer Personas via factory pattern (P1, Size: S)

**Problem**: 6 files are near-identical between Reader and Writer personas — API handlers, types, and admin settings. Adding a third persona type would mean copying everything again.

**What to do**:

1. **API side** — create `packages/ai-powerups/src/api/features/Personas/`:
   - `types.ts`: Shared `PersonaPreset { id, name, description, style? }` + `PersistedPersonas`
   - `createPersonasHandler.ts`: Factory function taking `{ name: string }`, returns handler class with shared Zod schema and mapping logic
   - `ReaderPersonasHandler.ts` and `WriterPersonasHandler.ts` become one-liner factory calls
   - Keep separate `declare module` augmentations per type (different keys on `IAiPowerUpsSettings`)

2. **Admin side** — create `packages/ai-powerups/src/admin/presentation/createPersonasSettingsGroup.ts`:
   - Factory taking config: `{ name, label, description, addItemLabel, itemTitlePrefix, descriptionHint, styleHint }`
   - `ReaderPersonasSettings.ts` and `WriterPersonasSettings.ts` each become thin wrappers

**Key files**:

- `packages/ai-powerups/src/api/features/ReaderPersonas/ReaderPersonasHandler.ts` (simplify)
- `packages/ai-powerups/src/api/features/WriterPersonas/WriterPersonasHandler.ts` (simplify)
- `packages/ai-powerups/src/admin/presentation/ReaderPersonasSettings.ts` (simplify)
- `packages/ai-powerups/src/admin/presentation/WriterPersonasSettings.ts` (simplify)

**Dependencies**: None. Independent.

---

## Item 3: Make token budget configurable (P2, Size: S)

**Problem**: `ProjectsHandler.ts` hardcodes `TOKEN_BUDGET = 150_000` and `CHARS_PER_TOKEN = 4`. Different models have different context windows. No way to adjust without code changes.

**What to do**:

- Create `TokenBudgetConfig` abstraction in `ai-powerups/src/api/features/Projects/abstractions.ts`
- Interface: `{ getTokenBudget(): number; getCharsPerToken(): number }`
- Default implementation returns current values (150K, 4)
- `ProjectsHandler` injects `TokenBudgetConfig` instead of using constants
- Consumers can override via `container.register()` for different models

**Key files**:

- `packages/ai-powerups/src/api/features/Projects/ProjectsHandler.ts`

**Dependencies**: None. Independent.

---

## Item 4: Extract `GenerationContextResolver` from use case (P2, Size: M)

**Problem**: `WbGeneratePageContentUseCase` has 5 constructor dependencies and handles settings lookup, persona resolution, project loading, file assembly, prompt building, and AI invocation. Lines 50-78 are pure context resolution logic.

**What to do**:

- Create `GenerationContextResolver` abstraction in `WbGeneratePageContent/abstractions.ts`
- Interface: `resolve(params): Promise<GenerationContext>` where `GenerationContext = { project?, readerPersona?, writerPersona?, files }`
- Implementation injects `GetSettingsUseCase` and `ProjectFileLoader`
- Use case drops to 3 dependencies: `GenerationContextResolver`, `Ai`, `Encryption` (+ `AiSdkTools`)

**Key files**:

- `packages/ai-powerups/src/api/features/WbGeneratePageContent/WbGeneratePageContentUseCase.ts`
- `packages/ai-powerups/src/api/features/WbGeneratePageContent/abstractions.ts`

**Dependencies**: Depends on Item 1 (`ProjectFileLoader`).

---

## Item 5: Eliminate silent error swallowing (P1, Size: S)

**Problem**: Empty catch blocks in `loadProjectFiles.ts` (lines 91, 104, 150) and `GenerateContentPresenter.ts` (line 133) make production debugging impossible.

**What to do**:

1. **`ProjectFileLoader`** (post-Item 1):
   - Cache deserialization failures: `console.warn` with cache key and error
   - Cache write failures: `console.warn` with cache key and error
   - S3/file retrieval failures: `console.warn` with file ID, bucket key, and error
   - Return type: `Result<{ files: ProjectFileContent[], warnings: string[] }>`

2. **`GenerateContentPresenter.ts`** (independent):
   - Add `error?: string` to ViewModel
   - Set it from catch block instead of just `console.error`

**Key files**:

- `packages/ai-powerups/src/api/features/WbGeneratePageContent/loadProjectFiles.ts`
- `packages/ai-powerups/src/admin/presentation/WbContentGeneration/GenerateContentPresenter.ts`

**Dependencies**: File loader changes depend on Item 1. Presenter fix is independent.

---

## Item 6: Decouple presenter from raw settings shape (P3, Size: S)

**Problem**: `GenerateContentPresenter` directly navigates `this._settings?.projects?.presets` in 5 private methods. If the settings shape changes, every method breaks.

**What to do**:

- Extract `IContentGenerationOptionsProvider` interface with methods: `getProjectOptions()`, `getProjectFileOptions(projectId)`, `getPersonaOptions(type)`, `getProjectDefaults(projectId)`, `getAllFileIds(projectId)`
- Implementation wraps `IAiPowerUpsSettings`
- Presenter injects the provider instead of raw settings

**Key files**:

- `packages/ai-powerups/src/admin/presentation/WbContentGeneration/GenerateContentPresenter.ts`

**Dependencies**: None, but low priority.

---

## Item 7: Export `buildPrompt` helpers for testing (P3, Size: XS)

**Problem**: `buildPersonaSections()` and `buildProjectSection()` in `buildPrompt.ts` are module-private. Non-trivial string assembly that should be independently testable.

**What to do**: Add `export` keyword to both functions.

**Key files**:

- `packages/ai-powerups/src/api/features/WbGeneratePageContent/buildPrompt.ts`

**Dependencies**: None.

---

## Execution Order

```
Phase 1 (parallel, no dependencies):
  [ ] Item 7: Export buildPrompt helpers                              [XS]
  [ ] Item 2: Unify Personas via factories                           [S]
  [ ] Item 3: Token budget config                                    [S]
  [ ] Item 5 (presenter part): Fix GenerateContentPresenter error    [XS]

Phase 2 (largest item, no blockers):
  [ ] Item 1: GetFileContentsUseCase + ProjectFileLoader             [L]

Phase 3 (depends on Item 1):
  [ ] Item 5 (file loader part): Fix error logging in ProjectFileLoader  [S]
  [ ] Item 4: Extract GenerationContextResolver                     [M]

Phase 4 (low priority):
  [ ] Item 6: Decouple presenter from settings shape                 [S]
```

## Verification

After each item:

- `yarn check -p @webiny/ai-powerups` — type check
- `yarn check -p @webiny/api-file-manager` — type check (for Item 1)
- `yarn check -p @webiny/api-file-manager-s3` — type check (for Item 1)
- `yarn build -p @webiny/ai-powerups 2>&1 | tail -30` — build succeeds
- `yarn lint` — no new lint errors
- Existing tests still pass: `yarn test packages/ai-powerups 2>&1 | tail -50`
