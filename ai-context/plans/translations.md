# Plan: Translate Page

> Source PRD: `ai-context/prds/translate-page.md`

## Architectural decisions

Durable decisions that apply across all phases:

- **GraphQL mutation**: `translatePage(pageId: ID!, languageCode: String!, folderId: ID!): WbPageResponse` added to the existing `WbMutation` type in the pages schema.
- **Page properties contract**:
  - `properties.language`: `string | undefined` — undefined means default language; set to a language code for translations.
  - `properties.sourcePage`: `string | undefined` — the `entryId` of the root base page. Always points to the original, never to an intermediate translation. Undefined for base pages.
  - `properties.path`: prefixed with `/<languageCode>` for translated pages. Root path `/` becomes `/<languageCode>` (no trailing slash).
- **Language model**: uses existing `LANGUAGE_MODEL_ID` (`"wbyLanguage"`) from `@webiny/languages`.
- **Package dependency**: `api-website-builder` gains a new dependency on `@webiny/languages` for `GetLanguageByCodeUseCase`.
- **No events**: `TranslatePageUseCase` does not publish domain events in this iteration.
- **Repository-level duplication**: `TranslatePageUseCase` calls `DuplicatePageRepository` (not `DuplicatePageUseCase`) to bypass double permission checks and event publishing.

---

## Phase 1: Language Query Use Cases

**User stories**: 6, 9

### What to build

Add two query use cases to `@webiny/languages` so other packages can look up languages programmatically:

- **`GetLanguageByCodeUseCase`** — takes a language code string, returns the language entry or a failure. Backed by a repository that uses CMS `ListLatestEntriesUseCase` with a filter on the `code` field.
- **`ListLanguagesUseCase`** — lists all language entries. Backed by a repository using CMS `ListLatestEntriesUseCase`.

Both follow the standard abstraction/implementation pattern (`createAbstraction` / `createImplementation` with constructor-injected dependencies). Register them in the languages package's API Extension and export them from the package's public API.

### Acceptance criteria

- [ ] `GetLanguageByCodeUseCase.execute("de")` returns the matching language entry when it exists.
- [ ] `GetLanguageByCodeUseCase.execute("xx")` returns a failure result when the code doesn't exist.
- [ ] `ListLanguagesUseCase.execute()` returns all language entries.
- [ ] Both use cases are registered in the languages API Extension container.
- [ ] Both use cases are exported from `@webiny/languages` public API.
- [ ] Tests: fetch existing language by code succeeds; fetch non-existent code returns failure.

---

## Phase 2: DuplicatePageRepository Callback

**User stories**: 7

### What to build

Enhance `DuplicatePageRepository` with an optional callback parameter that lets callers mutate page data before the CMS `CreateEntryUseCase` call. This avoids a separate update round-trip for features like translate-page that need to modify the duplicated data.

The callback receives the page data object (after the "Copy of" defaults are applied) and can mutate it in place. Existing callers that don't pass a callback continue to work unchanged.

The `DuplicatePageRepository` abstraction interface changes from:

```
execute(params: IDuplicateWbPageParams): Promise<Result<WbPage, Error>>
```

to:

```
execute(params: IDuplicateWbPageParams, callback?: (page: PageData) => Promise<void> | void): Promise<Result<WbPage, Error>>
```

### Acceptance criteria

- [ ] `DuplicatePageRepository.execute(params)` without a callback works identically to current behavior.
- [ ] `DuplicatePageRepository.execute(params, callback)` invokes the callback with the page data before creating the CMS entry, and the created page reflects the callback's mutations.
- [ ] `DuplicatePageUseCase` continues to work without changes (no callback passed).
- [ ] Tests: duplicate with callback mutates page data correctly; duplicate without callback preserves existing behavior.

---

## Phase 3: TranslatePage Feature

**User stories**: 1, 2, 3, 4, 5, 6, 7, 8

### What to build

A new `TranslatePage` feature in `api-website-builder` that creates a translated copy of an existing page.

**TranslatePageUseCase** steps:

1. Check write permission via `WbPermissions.canCreate("page")`.
2. Validate the language code by calling `GetLanguageByCodeUseCase`. Return `PageTranslationError` if not found.
3. Fetch the source page to resolve lineage: if `properties.sourcePage` is already set (source is itself a translation), use that value; otherwise use the source page's `entryId`.
4. Call `DuplicatePageRepository.execute(pageId, callback)` with a callback that sets:
   - `properties.language` → the provided language code.
   - `properties.sourcePage` → the resolved root base page entryId.
   - `properties.path` → `/<languageCode><originalPath>` (for root `/`, just `/<languageCode>`).
   - `location.folderId` → the provided folder ID.

**Domain error**: `PageTranslationError` extending the project's standard error pattern.

**GraphQL resolver**: follows the same pattern as other page mutations — resolve use case from container, call execute, return response.

**Feature registration**: `TranslatePageFeature` registered alongside existing page features.

### Acceptance criteria

- [ ] `translatePage(pageId, "de", folderId)` on a base page creates a new page with `properties.language = "de"`, `properties.sourcePage` pointing to the base page's `entryId`, `properties.path` prefixed with `/de`, and `location.folderId` set.
- [ ] Translating an already-translated page resolves `properties.sourcePage` to the original root base page, not the intermediate translation.
- [ ] Root path `/` becomes `/de` (not `/de/`).
- [ ] Invalid language code returns a `PageTranslationError` failure.
- [ ] The translated page is a full copy (elements, bindings, metadata, extensions).
- [ ] The translated page can be fetched by its new ID with correct data.
- [ ] GraphQL mutation `translatePage` is available and returns the standard `WbPageResponse`.
- [ ] Tests: translate base page; translate a translation (chain lineage); root path handling; invalid language code; folder placement; fetch translated page by ID.
