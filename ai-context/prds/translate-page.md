# PRD: Translate Page Mutation

## Problem Statement

The Website Builder currently has no way to create language-specific versions of pages. Content editors working on multilingual sites need to manually duplicate pages and adjust paths and metadata by hand, which is error-prone and doesn't establish any traceable link between the original page and its translations. There is no structured way to know which pages are translations of which base page.

## Solution

Introduce a `translatePage(pageId, languageCode, folderId)` GraphQL mutation in `api-website-builder` that creates a full copy of an existing page into a specified folder, assigns it a language code, prefixes its URL path with the language code, and records a reference back to the original (base) page. This establishes a clear lineage between a base page and all its translations.

The translation process remains manual — the user triggers the mutation, then edits the translated page's content through the UI. This mutation provides the structural scaffolding; automated translation is out of scope.

## User Stories

1. As a content editor, I want to translate a base page to a specific language, so that I can create a language-specific version of that page with the correct URL path prefix.
2. As a content editor, I want translated pages to automatically get the language code prefixed to the path (e.g., `/about` becomes `/de/about`), so that URL routing for multilingual content is consistent.
3. As a content editor, I want translated pages to reference their original base page via `properties.sourcePage`, so that I can trace all translations back to a single source page.
4. As a content editor, I want to translate an already-translated page to yet another language, so that I can create translations from any existing version while still tracking lineage to the original base page.
5. As a content editor, I want the translation to be placed in a folder of my choosing, so that I can organize translated content according to my project's folder structure.
6. As a content editor, I want the mutation to fail with a clear error if I provide an invalid language code, so that I don't accidentally create pages with nonexistent languages.
7. As a content editor, I want the translated page to be a full copy (elements, bindings, metadata, extensions), so that I have a complete starting point to manually translate the content.
8. As a content editor, I want the homepage path `/` to become `/de` (not `/de/`) when translated, so that language-prefixed homepages have clean URLs.
9. As a developer, I want language lookup use cases (`GetLanguageByCodeUseCase`, `ListLanguagesUseCase`) exposed from the `@webiny/languages` package, so that other packages can validate and query languages programmatically.
10. As a developer, I want the `TranslatePageUseCase` to be a well-defined abstraction with a clean interface, so that it can be extended or replaced in future iterations (e.g., automated translation).

## Implementation Decisions

### Prerequisite: Language Query Use Cases in `@webiny/languages`

The `@webiny/languages` package currently has no dedicated query use cases — it relies on generic HeadlessCMS use cases internally. Two new use cases must be added:

- **`GetLanguageByCodeUseCase`**: Takes a language code string, returns the language entry or a failure. Implemented via a repository that uses CMS `ListLatestEntriesUseCase` with a filter on the `code` field. This is the use case `api-website-builder` will use to validate language codes.
- **`ListLanguagesUseCase`**: Lists all language entries. Implemented via a repository using CMS `ListLatestEntriesUseCase`. Useful for UI and other consumers.

Both use cases follow the same abstraction pattern used throughout the codebase (`createAbstraction` / `createImplementation` with constructor-injected dependencies). Repositories are backed by CMS use cases, using the `LANGUAGE_MODEL_ID` ("wbyLanguage") model. The language model has fields: `name`, `code`, `direction` (ltr/rtl), `isDefault`, `enabled`.

These use cases should be registered in the languages package's API Extension and exported from the package's public API.

### New Feature in `api-website-builder`: TranslatePage

**GraphQL mutation:**

```
translatePage(pageId: ID!, languageCode: String!, folderId: ID!): WbPageResponse
```

Added to the existing `WbMutation` type in the pages schema.

**TranslatePageUseCase:**

- Follows the established UseCase pattern (abstraction + implementation + DI).
- Dependencies: `WbPermissions`, `DuplicatePageRepository`, `GetLanguageByCodeUseCase`.
- Checks write permission, then delegates to the repository (NOT use case - repository. This way we bypass double permissions checks and events).
- No events for now — this will be added later if needed.
- Steps:

1. Validate language code by calling `GetLanguageByCodeUseCase`. If not found, return a `PageTranslationError` (domain error).
2. Resolve `properties.sourcePage`: if the source page already has `properties.sourcePage` set (i.e., it's itself a translation), use that value; otherwise use the source page's `entryId`.
3. Call `DuplicatePageRepository.execute(pageId, callback)` with a callback that modifies the page before creation:
   - Set `properties.language` to the provided language code.
   - Set `properties.sourcePage` to the resolved value from step 2.
   - Update `properties.path`: prefix with `/<languageCode>`. For root path `/`, use `/<languageCode>` (not `/<languageCode>/`).
   - Set `location.folderId` to the provided `folderId`.

**Performance optimization — DuplicatePageRepository callback:**

`DuplicatePageRepository` should be enhanced with an optional callback parameter that allows callers to modify page data before the CMS `CreateEntryUseCase` call. This avoids a separate update round-trip. The callback receives the page data object and can mutate it in place:

```
await this.duplicatePage.execute(id, async (page) => {
    page.properties["path"] = `/${languageCode}${translatedSegment}`;
    page.properties["language"] = languageCode;
    page.properties["sourcePage"] = resolvedSourcePageId;
    page.location.folderId = folderId;
});
```

This is a backward-compatible change — existing callers of `DuplicatePageRepository` that don't pass a callback continue to work as before.

- Dependencies: `GetLanguageByCodeUseCase` (from `@webiny/languages`), `DuplicatePageRepository`.

**Page properties contract:**

- `properties.language`: `string | undefined`. Undefined (or absent) means default language. Set to a language code string (e.g., `"de"`, `"fr"`) for translations.
- `properties.sourcePage`: `string | undefined`. The `entryId` of the base page this translation originated from. `undefined` for base pages. Always points to the root base page, never to an intermediate translation.
- `properties.path`: Prefixed with `/<languageCode>` for translated pages. Base pages keep their original path.

**Domain error:**

- `PageTranslationError` — thrown when the language code is not found in the language registry. Should extend the project's standard error pattern.

**Feature registration:**

- A new `TranslatePageFeature` registered in the `api-website-builder` plugin setup, following the same pattern as `CreatePageFeature`, `DuplicatePageFeature`, etc.
- `TranslatePageRepository` registered in singleton scope.
- `TranslatePageUseCase` registered normally.

**Dependency between packages:**

- `api-website-builder` will import `GetLanguageByCodeUseCase` from `@webiny/languages` and resolve it from the container. This creates a new package dependency.

### GraphQL resolver pattern

The resolver follows the same pattern as all other page mutations:

1. Resolve `TranslatePageUseCase` from `context.container`.
2. Call `execute({ pageId, languageCode, folderId })`.
3. If result is a failure, throw the error.
4. Return `new Response(result.value)` (the new `WbPage`).

## Testing Decisions

**What makes a good test:** Tests should verify external behavior through the public interface (use case `execute` method), not implementation details. They should assert on the shape and content of the returned page, not on internal repository calls.

**Modules to test:**

1. **`TranslatePageUseCase`** (in `api-website-builder`):
   - Translate a base page: verify the returned page has the correct `properties.language`, `properties.sourcePage` (pointing to base page's `entryId`), `properties.path` (prefixed), and `location.folderId`.
   - Translate an already-translated page: verify `properties.sourcePage` still points to the original base page, not the intermediate translation.
   - Translate with root path `/`: verify path becomes `/<languageCode>`.
   - Translate with invalid language code: verify a `PageTranslationError` is returned.
   - Fetch the translated page by its new ID: verify it can be retrieved and has correct data.

2. **`GetLanguageByCodeUseCase`** (in `@webiny/languages`):
   - Fetch an existing language by code: verify correct language is returned.
   - Fetch a non-existent language code: verify failure result.

**Prior art:** Existing tests in `packages/api-website-builder/__tests__/pages.test.ts` — they resolve use cases from the container and assert on `Result` values.

## Out of Scope

- Automated/AI-powered translation of page content.
- UI changes for triggering translation (this is API-only).
- Enforcing uniqueness of language per folder (duplicates are allowed).
- Publishing behavior for translated pages (follows existing publish flow).
- Bulk translation (translating multiple pages at once).
- Modifying the base page to track its translations (lineage is one-directional: translation points to base).
- Events (`PageBeforeTranslateEvent` / `PageAfterTranslateEvent`) — deferred to a future iteration.
- Updating `properties.language` on existing base pages (it remains implicit/undefined for default language).

## Further Notes

- The `TranslatePageUseCase` is intentionally designed as a clean abstraction to support future upgrades (e.g., plugging in automated translation services).
- The `@webiny/languages` package dependency is new for `api-website-builder`. This should be reflected in `package.json` and the dependency graph.
