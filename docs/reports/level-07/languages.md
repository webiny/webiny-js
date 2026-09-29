# @webiny/languages

> Level 7 · commit 19c9ca1b91 · audited 2026-09-26

## Summary

`@webiny/languages` is a small, focused feature that models "system languages" (name/code/direction/default/enabled) as a hidden `.public()` headless-CMS content model (`LanguageModel.ts`), exposes read-only query use cases (`ListLanguages`, `GetLanguageByCode`, `GetDefaultLanguage`) consumed by other packages (`@webiny/api-website-builder`'s page translation, `@webiny/ai-powerups`'s translate-page decorator), and an event handler that enforces the single-default-language invariant (`UnsetDefaultLanguagesHandler`). There is no bespoke create/update/enable/disable API here at all — unlike `@webiny/tenant-manager`, every mutation (create/update/delete a language) goes through the generic headless-CMS content-entry API, gated only by the `AddCmsPermissions` permission transformer. A security finding in that transformer is tracked privately (SEC-38). Separately, two of the three read paths (`GetDefaultLanguageRepository`, `GetLanguageByCodeRepository`) don't filter out disabled languages the way `ListLanguagesRepository` does, so a disabled/hidden language can still be returned as "the default" or "found by code." Health is otherwise good: the code is small, consistently structured, and has a real (if narrow) test suite. It correctly reuses `@webiny/api-headless-cms`'s model-builder/entry use cases rather than reimplementing storage.

## Public API

- `ListLanguagesUseCase` / `GetLanguageByCodeUseCase` / `GetDefaultLanguageUseCase` (`exports/api/languages.ts`) — the three read use cases; `GetLanguageByCodeUseCase` is consumed by `packages/api-website-builder/src/features/pages/TranslatePage/TranslatePageUseCase.ts`, `GetDefaultLanguageUseCase` by `packages/ai-powerups/src/api/features/WbTranslatePage/WbTranslatePageDecorator.ts`, both outside this package.
- `LanguagesPermissions` (`api/features/Permissions/abstractions.ts`) — the typed permissions-abstraction wrapper for the `languages.*` schema; used internally only (1 caller, its own `feature.ts`).
- `useLanguages` (`admin/presentation/hooks/useLanguages.tsx`) and the admin `listLanguages` feature (`admin/features/listLanguages/*`) — the admin-side cached language list, with its own `LanguagesCache`/gateway/repository and three event handlers (`LanguageEntryAfterCreateHandler`/`AfterUpdateHandler`/`AfterDeleteHandler`) that invalidate the cache when a language entry changes via the generic CMS entry mutations.
- `Languages` (`Languages.tsx`) — the top-level extension component; registered from `packages/project-template-base/src/DefaultExtensions.tsx`.

## Bugs

| # | Severity | Location | Problem | Failure scenario | Confidence |
|---|---|---|---|---|---|
| 1 | high | `packages/languages/src/api/features/AddCmsPermissions/AddCmsPermissions.ts` | Security finding SEC-38 — see private notes. | — | high |
| 2 | medium | `packages/languages/src/api/features/GetDefaultLanguage/GetDefaultLanguageRepository.ts:23-30`, `packages/languages/src/api/features/GetLanguageByCode/GetLanguageByCodeRepository.ts:23-30` | Both repositories query `listLatestEntries` with no `enabled: true` filter, unlike the sibling `ListLanguagesRepository.ts:23-31`, which explicitly filters `where: { values: { enabled: true } }`. There is also nothing anywhere in this package that prevents an admin from disabling the language currently marked `isDefault: true` (no bespoke "disable language" use case exists — it happens through the generic CMS content-entry update, with no cross-field validation). | An admin disables the current default language (or a specific language a page has been translated into) through the generic content-entry edit form. `GetDefaultLanguageUseCase`/`GetLanguageByCodeUseCase` — consumed by `api-website-builder`'s `TranslatePageUseCase` and `ai-powerups`'s `WbTranslatePageDecorator` — still return that language as valid, contradicting the model field's own documented intent ("Disabled languages are hidden from the public site... but the default language is shown when no specific language is requested"). Content can end up served in, or translated into, a language an admin explicitly disabled. | high |

## Duplication

- `ListLanguagesRepository.ts`, `GetDefaultLanguageRepository.ts` and `GetLanguageByCodeRepository.ts` (jscpd: 4 clone blocks, up to 53% of `ListLanguagesRepository.ts` duplicated) share near-identical "resolve model → call `listLatestEntries` → map entries to the `Language` DTO" bodies, differing only in the `where`/`limit` clause and the not-found handling. A shared `mapEntryToLanguage()` helper and a common "resolve model or fail" helper would remove most of this and would also have prevented Bug #2 above (the missing `enabled` filter would have been visible in one place instead of three).
- Security finding SEC-38 has a sibling in `@webiny/tenant-manager` (SEC-34); see private notes.

## Dead code

None found — `Language`, `ListLanguagesUseCase`, `GetLanguageByCodeUseCase` and `GetDefaultLanguageUseCase` all have confirmed real consumers (codegraph), and the admin `listLanguages` feature's cache/handlers are wired together and used by `useLanguages`.

## Convention issues

None of significance — DI implementation/abstraction/feature split is followed consistently, file names match their exported class/const, and `Language`/`LanguageDto` are named interfaces rather than inline object types.

## Test gaps

`__tests__/languages.test.ts` covers `GetLanguageByCodeUseCase` and `ListLanguagesUseCase` (found/not-found and empty/populated cases), but there is no test for `GetDefaultLanguageUseCase`, none for `UnsetDefaultLanguagesHandler`'s single-default-language enforcement, and none that would have caught the missing `enabled` filter in Bug #2 (no test creates a disabled default/by-code language and asserts it is or isn't returned).

## Recommendations

1. Address security finding SEC-38 (see private notes).
2. Add an `enabled: true` filter to `GetDefaultLanguageRepository` and `GetLanguageByCodeRepository` (or explicitly document why a disabled language should still resolve), and add tests for both the default-language and by-code lookups against a disabled language.
3. Extract the shared "resolve model → list/map to `Language`" logic out of the three near-identical repositories into one helper to remove the jscpd-flagged duplication and its associated risk of exactly this kind of filter drift.
