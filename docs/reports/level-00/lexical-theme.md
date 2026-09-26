# @webiny/lexical-theme

> Level 0 · commit 19c9ca1b91 · audited 2026-09-26

## Summary
A tiny, dependency-light package (only `lexical` as a runtime dep) that models the "theme" concept used by Webiny's Lexical-based rich text editor: `createTheme()`/`createLexicalTokens()` build the `EditorTheme`/`EditorThemeClasses` object (CSS class names, colors, typography, font sizes) handed to `LexicalComposer`, and the `Theme` class recovers a rich `EditorTheme`-like object back out of Lexical's internal `EditorThemeClasses` at node-render time via a global, string-keyed cache (`Theme.from`). Health is otherwise fine (small, readable, no runtime deps beyond `lexical`), but `Theme.from`'s cache-key handling is fragile and has at least one confirmed real-world misuse in the monorepo (see Bugs #1).

## Public API
- `createTheme(params)` (`src/createTheme.ts:11`) — builds an `EditorTheme`. ~3 in-repo callers: `packages/sdk-frontend/src/index.ts`, `packages/website-builder-react/src/index.ts`, `packages/website-builder-vue/src/index.ts`; also exercised by `packages/react-rich-text-lexical-renderer/__tests__/theme.ts`.
- `createLexicalTokens(classPrefix)` (`src/createLexicalEditorTokens.ts:3`) — internal helper, used only by `createTheme`; not separately imported elsewhere.
- `Theme` class (`src/Theme.ts:19`) — `Theme.from(lexicalTheme)` is the main entry point, called throughout `@webiny/lexical-nodes` (`HeadingNode`, `QuoteNode`, `ParagraphNode`, `ListNode`, `FontColorNode`) and `packages/website-builder-sdk/src/ContentSdk.ts`, to recover colors/typography from a live Lexical editor's theme classes. `getTypographyById`/`getTypographyByTag` are used heavily by `@webiny/lexical-editor`'s toolbar actions (`TypographyAction`, `QuoteAction`, `BulletListAction`, `NumberedListAction`, `EditorPlaceholder`).
- `toTypographyMap(theme)` (`src/toTypographyMap.ts:3`) — exported standalone function with no consumers found outside this package (see Dead code).
- `types.ts` — `ColorValue`, `FontSizes`, `TypographyValue`, `EditorTheme`, `TypographyMap`, re-exported and used package-wide by `@webiny/lexical-editor`, `@webiny/lexical-nodes`, `@webiny/website-builder-sdk`, `@webiny/app-admin`.

## Bugs
| # | Severity | Location (file:line) | Problem | Failure scenario | Confidence |
|---|---|---|---|---|---|
| 1 | high | `src/Theme.ts:54-74` (`Theme.from`) | The static, process-wide `Theme.cache` is keyed directly by the caller-supplied `$cacheKey` string with no validation and no fallback derivation. If a caller omits `$cacheKey`, the object key becomes the literal string `"undefined"` for every theme, so the *first* theme ever passed through `Theme.from` in the process gets cached under `"undefined"` and every subsequent call with a different theme (but still no `$cacheKey`) hits `if (!Theme.cache["undefined"])` → false, and silently returns the **first** theme's stale colors/typography instead of the current one. | `packages/app-admin/src/presentation/textToLexicalTool/textToLexicalState.ts:13-19` builds `editorConfig.theme = { $colors: lexicalTheme.colors, $typography: lexicalTheme.typography }` — no `$cacheKey` (and no `$fontSizes`) — before calling `createHtmlToLexicalParser`/`createLexicalStateTransformer`, whose node `createDOM`/`exportDOM` implementations (e.g. `packages/lexical-nodes/src/HeadingNode.ts:110`, `ParagraphNode.ts:101`) call `Theme.from(config.theme)`. In a long-lived process (e.g. the admin SPA, or any server reusing the module), the AI "text to Lexical" tool run against one site/theme will poison the cache for every subsequent call with a different theme, producing wrong typography class names for unrelated content. | high |
| 2 | low | `src/Theme.ts:20,54-74` | `Theme.cache` is a static field that is never pruned/cleared; every distinct `$cacheKey` seen by the process adds a permanent entry. | Long-lived processes (e.g. the admin SPA) that render many distinct themes over a session slowly leak `Theme` instances. Low severity in practice since the number of distinct themes actually used tends to be small. | medium |

## Duplication
- `src/Theme.ts:111-119` (private method `toTypographyMap`) duplicates the logic of the standalone exported `src/toTypographyMap.ts:3-15` almost exactly (same `Object.keys(...).reduce` building an `id -> TypographyValue` map); they differ only in whether the input is `EditorTheme` or `EditorTheme["typography"]` directly. jscpd doesn't flag this (different call signatures break its structural match), but it's the same algorithm maintained in two places — a change to one (e.g. handling duplicate ids) won't propagate to the other.
- jscpd found no cross-file or in-file token-level clones in this package otherwise (`jscpd-lexical-theme/jscpd-report.json` shows 0 clones across all 5 TS sources and the CSS file).

## Dead code
- `toTypographyMap` (`src/toTypographyMap.ts:3`, re-exported from `src/index.ts:4`) has no consumer anywhere in the monorepo outside `lexical-theme/src` itself (confirmed via grep across all packages) — `Theme` uses its own private duplicate instead (see Duplication). This looks like a public export that predates/was superseded by the `Theme` class.

## Convention issues
- None significant. `src/index.ts` only re-exports `createTheme`, `types`, `Theme`, and `toTypographyMap` — all are (or were meant to be) genuine external entry points, consistent with the "minimal barrel exports" convention.

## Test gaps
- No `__tests__` directory exists in this package at all. `createTheme`/`createLexicalTokens` are indirectly exercised by `packages/react-rich-text-lexical-renderer/__tests__/theme.ts`, but the entire `Theme` class — the cache-key resolution in `Theme.from` (Bug #1), `getTypographyById`/`getTypographyByTag`, `Theme.empty()`, `Theme.lastUsedTheme` fallback — has zero direct test coverage anywhere in the repo.

## Recommendations
1. Fix `Theme.from`'s cache-key handling (`src/Theme.ts:54-74`): derive a cache key deterministically from the theme content itself (e.g. hash of `$colors`/`$typography`/`$fontSizes`) instead of trusting an optional, caller-supplied `$cacheKey`, or throw/warn loudly when `$cacheKey` is missing instead of silently colliding on `"undefined"`.
2. Fix the reachable trigger in `packages/app-admin/src/presentation/textToLexicalTool/textToLexicalState.ts:13-19` to pass a `$cacheKey` (and `$fontSizes`) consistent with `RichTextEditor.tsx`/`LexicalHtmlRenderer.tsx`, so the AI text-to-Lexical tool doesn't share a poisoned theme cache with other editor instances.
3. Add unit tests for `Theme.from`/`Theme.cache` behavior (repeat calls with same vs. different `$cacheKey`, missing `$cacheKey`, missing `$colors` fallback to `lastUsedTheme`/`empty()`), and either remove the dead `toTypographyMap` export or have `Theme` reuse it instead of duplicating the logic.
