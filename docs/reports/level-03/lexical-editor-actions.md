# @webiny/lexical-editor-actions

> Level 3 · commit 19c9ca1b91 · audited 2026-09-26

## Summary
`@webiny/lexical-editor-actions` is a very small, focused package (4 source files, ~510 lines) that registers two concrete toolbar UI actions — a font-color picker and a text-alignment/indent dropdown — into `@webiny/lexical-editor`'s `FontColorAction`/`TextAlignmentAction` extension points via a single `LexicalEditorActions` component. It correctly builds on its dependencies (`@webiny/lexical-editor`'s `DropDown`/`DropDownItem`/`useRichTextEditor`/`useFontColorPicker`/`useTextAlignmentAction`, `@webiny/admin-ui`'s `Tooltip`, and `@webiny/icons` SVGs) rather than reimplementing them, has no internal duplication, and has no automated tests. Overall health is good; the only concrete issue found is a stale-memoization bug in the color picker's theme-colors list.

## Public API
- `LexicalEditorActions` (`src/LexicalEditorActions.tsx:10`, re-exported from `src/index.ts:1`) — the package's sole public export; rendered once, in `packages/app-serverless-cms/src/Admin.tsx`, to register the font-color and text-alignment toolbar actions into the global composition scope consumed by `@webiny/lexical-editor`'s `StaticToolbar`.
- `LexicalColorPickerDropdown` (`src/components/LexicalColorPickerDropdown.tsx:10`) and `TextAlignmentDropdown` (`src/components/TextAlignmentDropdown.tsx:12`) — internal-only components (not re-exported from `index.ts`), each rendered exactly once, from `LexicalEditorActions.tsx`.
- `LexicalColorPicker` (`src/components/LexicalColorPicker/LexicalColorPicker.tsx:65`) — internal presentational swatch/`ChromePicker` widget, rendered only from `LexicalColorPickerDropdown`.

## Bugs
| # | Severity | Location | Problem | Failure scenario | Confidence |
|---|----------|----------|---------|-------------------|------------|
| 1 | medium | `packages/lexical-editor-actions/src/components/LexicalColorPicker/LexicalColorPicker.tsx:116` | `themeColors` is computed with `useMemo(() => theme?.colors ?? [], [])` — an empty dependency array, so `theme.colors` is captured once on first render and never recomputed even though `theme` comes from context (`useRichTextEditor()`) and is read fresh on every render. | If the component stays mounted (e.g. dropdown content not remounted on open/close) and the surrounding rich-text editor's theme is reconstructed with a new `colors` array (theme context value is itself rebuilt via `useMemo(..., [theme])` in `RichTextEditorContext`, so a new caller-supplied theme prop produces a new `colors` reference), the swatch list and the `isThemeColor` check (which depends on the same stale `themeColors`) keep showing the old, first-rendered color palette instead of the current one. | medium |

## Duplication
jscpd reports zero internal clones (11 sources, 0 duplicated lines). No reimplementation of lower-level utilities was found; the package reuses `@webiny/admin-ui`'s `Tooltip`, `@webiny/lexical-editor`'s `DropDown`/`DropDownItem`/`Divider`/hooks, and `@webiny/icons` SVGs rather than rebuilding them.

## Dead code
None found — the single public export (`LexicalEditorActions`) and its two internal sub-components each have a confirmed, live render call site (codegraph: `app-serverless-cms/src/Admin.tsx` → `LexicalEditorActions` → `LexicalColorPickerDropdown`/`TextAlignmentDropdown`).

## Convention issues
`TextAlignmentDropdown.tsx:4` imports `useDeriveValueFromSelection` via the deep path `@webiny/lexical-editor/hooks/useCurrentSelection.js` instead of the package's own barrel (`@webiny/lexical-editor`, which re-exports it through `src/index.ts` → `src/hooks/index.ts`); every other cross-package import in this file and its sibling components goes through the top-level barrel, so this one deep import is an inconsistency worth normalizing.

## Test gaps
There is no `__tests__` directory in this package at all. Notably untested: the alpha-normalization and color-fallback logic in `LexicalColorPicker.tsx` (`withColorFallback`, the `rgb.a === 0 ? 1 : rgb.a` handling in `onColorChange`/`onColorChangeComplete`), the `isThemeColor` derivation (affected by the memoization bug above), and `TextAlignmentDropdown`'s RTL-aware icon swap for indent/outdent.

## Recommendations
1. Fix the `useMemo` dependency array in `LexicalColorPicker.tsx:116` (`[theme]` or `[theme?.colors]`) so the swatch list and `isThemeColor` stay correct if the editor theme is ever rebuilt while the component is mounted.
2. Normalize the `TextAlignmentDropdown.tsx` import of `useDeriveValueFromSelection` to go through `@webiny/lexical-editor`'s public barrel instead of its internal `hooks/useCurrentSelection.js` path.
3. Add basic unit/interaction tests for `LexicalColorPicker` (theme-color selection, custom-color toggle, reset-to-inherit) and `TextAlignmentDropdown` (alignment selection, RTL indent/outdent icon swap), since the package currently ships with zero test coverage.
