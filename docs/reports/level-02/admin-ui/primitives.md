# @webiny/admin-ui — Primitives, form controls and shared infrastructure

> Level 2 · commit 19c9ca1b91 · audited 2026-09-26

## Summary

This slice covers everything in `packages/admin-ui/src` outside the pickers and navigation slices: the app-wide `AdminUiProvider`/`useAdminUi` context, the `FormComponent`/`DelayedOnChange` form-control plumbing, `hooks/useDisclosure`, `utils.tsx`, the top-level barrels (`index.ts`, `exports/admin/ui.ts`), and roughly thirty simple controls (Button, IconButton, CopyButton, Input, Textarea, Checkbox, CheckboxGroup, RadioGroup, Switch, Toggle, ToggleGroup, SegmentedControl, Slider, RangeSlider, CodeEditor, ProgressBar, Card, Grid, Text, Heading, Label, Icon, Image, Link, Avatar, Alert, BetaBadge, EmptyState, Skeleton, Loader, ScrollArea, Scrollbar, Separator, TimeAgo, Markdown, DragCursor, FillViewport, Tag). Architecturally every non-trivial control follows the same hand-rolled MVP pattern (a `use<Name>` hook that wires a mobx `<Name>Presenter` into React state via `useMemo`+`useEffect`+`autorun`, plus `domains/` value objects and mappers), which is consistent but produces a lot of copy-pasted boilerplate (see Duplication). The package correctly reuses `@webiny/react-composition`'s `makeDecoratable` for every component and `@webiny/utils`'s `generateId` rather than reimplementing them, which is good hygiene toward its level-0/1 dependencies. Overall health is solid — no critical bugs — but there is a confirmed medium-severity data-staleness bug in `CodeEditor` (uses Monaco's uncontrolled `defaultValue`), an unbounded markdown cache in `AdminUiProvider`, and heavy, well-established duplication of the hook/presenter wiring and of the form-field wrapper layout across nearly every simple control.

## Public API

- `AdminUiProvider` / `useAdminUi` (`AdminUiProvider/AdminUiProvider.tsx:36,90`) — app-root context providing `linkComponent`, `compileMarkdown`, `fileUrlFormatter`; mounted once in `packages/app-admin/src/base/providers/UiProviders.tsx`; `useAdminUi` has ~20 callers across admin-ui (Alert, FormComponent, DropdownMenu, FilePicker, etc.).
- `DelayedOnChange` (`DelayedOnChange/DelayedOnChange.ts:52`) — debounced onChange wrapper for Input/Textarea-like fields; ~25 callers, e.g. `app-admin`'s IconPicker, LexicalEditor plugin, SearchBar, `IconColorPicker`.
- `FormComponent*` (`FormComponent/Description.tsx`, `Note.tsx`, `Label.tsx`, `ErrorMessage.tsx`) — shared label/description/note/error rendering used by essentially every form control in the package (Input, Textarea, CheckboxGroup, RadioGroup, CodeEditor, pickers, etc.).
- `Button` / `IconButton` / `CopyButton` (`Button/*`) — ~295 render sites monorepo-wide (name collides in the count with an unrelated `Button` in `app-aco`, but the bulk are admin-ui's).
- `Input` / `Textarea` / `CodeEditor` — form wrappers around primitives + `FormComponent`; `CodeEditor` alone has 14 real consumers (audit-logs Preview, background-tasks TaskDetailDrawer, GraphQL/SDK playgrounds, etc.).
- `Text` / `Heading` / `Icon` / `Card` / `Grid` / `Label` — base layout/typography primitives, consumed hundreds of times across `packages/admin-ui` itself and dozens of `app-*` packages.
- `utils.tsx`: `cn` (tailwind-merge wrapper), `generateId` (thin wrapper around `@webiny/utils/generateId`), `withStaticProps` (36 callers), `createComponentPropsProvider` (6 callers, used by Accordion/Alert/Card prop-provider patterns), `omit` (10 callers).
- `hooks/useDisclosure` — open/close+data hook; re-exported from the package root.

## Bugs

| # | Severity | Location (file:line) | Problem | Failure scenario | Confidence |
|---|----------|----------------------|---------|-------------------|------------|
| 1 | medium | `CodeEditor/CodeEditorPrimitive.tsx:40` | `<MonacoEditor defaultValue={value} .../>` — Monaco's `defaultValue` only sets the *initial* model content; it is not reactive like `value`. | `PayloadTab` in `packages/app-audit-logs/src/views/Logs/Preview/Preview.tsx:26` renders `<CodeEditor value={JSON.stringify(...)} .../>` inside a component that stays mounted while the user clicks through different audit-log rows in the same drawer (`presenter.vm.auditLog` changes without remounting). Because the prop is bound to `defaultValue`, the editor keeps showing the first-rendered payload instead of the newly selected log entry's JSON — same pattern would affect `TaskDetailDrawer.tsx:108`'s `JsonSection` if reused across different tasks without a `key`. | high |
| 2 | low | `AdminUiProvider/AdminUiProvider.tsx:42-68` | `cacheRef` is a plain `Map<string, ReactNode>` keyed by the raw markdown string, cleared only when `markdownCompiler` itself changes; it never evicts entries otherwise. | `AdminUiProvider` is mounted once for the lifetime of the admin app. In a long admin session where many distinct per-record markdown strings are compiled (e.g. content entry descriptions, audit log notes), the cache grows unboundedly for the life of the tab. | medium |
| 3 | low | `ProgressBar/presenters/ProgressBarPresenter.ts:57-62` | `getValueLabel` computes `Math.round((value / max) * 100)+"%"` with no clamping and no guard for `max === 0`. | A caller that passes `max={0}` (e.g. a total-count computed before data loads) gets `"Infinity%"` or `"NaN%"`; a `value` greater than `max` renders `>100%`. Not currently exercised by any caller found, but the presenter itself performs no validation. | low |
| 4 | low | `Button/CopyButton.tsx:22-27` | `copyToClipboard` is memoized with `useCallback(..., [value])`, but the callback body also reads `onCopy` from the closure. | If a consumer passes a new `onCopy` on re-render without changing `value`, the memoized callback keeps calling the stale `onCopy` from the first render that established `value`. | low |
| 5 | low | `src/index.ts:29-30` | `export * from "./HeaderBar/index.js";` is duplicated (identical line twice). | No functional effect (dedup happens naturally), but it is dead weight / copy-paste leftover in the main package barrel. | high |

Security: none found.

## Duplication

jscpd for the whole package reports 129 clone pairs / 2492 duplicated lines. Grouping the raw clone list by the top-level folder pair (excluding pickers/navigation-only pairs) gives, package-wide:

| Pattern (folders involved) | Clone pairs | Approx. duplicated lines |
|---|---|---|
| AutoComplete ↔ MultiAutoComplete (pickers slice) | 23 | ~620 |
| MultiAutoComplete internal self-duplication (pickers slice) | 14 | ~321 |
| **EmptyState internal (illustrations)** | 8 | ~183 |
| Sidebar internal (navigation slice) | 6 | ~148 |
| FilePicker internal (pickers slice) | 9 | ~72 |
| **Tags ↔ Textarea** | 6 | ~99 |
| **CheckboxGroup internal (test file)** | 4 | ~83 |
| **SegmentedControl ↔ ToggleGroup** | 4 | ~83 |
| DataList internal (navigation slice) | 4 | ~79 |
| DatePicker internal (pickers slice) | 4 | ~61 |
| MultiSelect ↔ Select / IconPicker ↔ Select (pickers slice) | 6 | ~104 |
| **Switch ↔ Toggle, Slider ↔ Toggle, RangeSlider ↔ Toggle, Checkbox ↔ Toggle, CheckboxGroup ↔ Toggle, ColorPicker ↔ Toggle, MultiFilePicker ↔ Toggle, AutoComplete ↔ Toggle** | 8 | ~150 |
| Everything else (≤2 pairs each: Dialog↔Drawer, Input↔Textarea, Input/Textarea↔Select, RadioGroup↔SegmentedControl/Select, Card↔Widget, Tree, etc.) | ~40 | remainder |

Bold rows are in this slice. The single largest actionable pattern for this slice, however, is **not fully captured by jscpd's pairwise matching** because it recurs across ~20 files with small per-file variations: every simple control's `use<Name>.ts` hook (`Toggle/primitives/useToggle.ts`, `Switch/primitives/useSwitch.ts`, `Slider/primitives/useSlider.ts`, `RangeSlider/primitives/useRangeSlider.ts`, `CheckboxGroup/primitives/useCheckboxGroup.ts`, `Checkbox/primitives/useCheckbox.ts`, `ProgressBar/useProgressBar.ts`, plus the picker-slice equivalents) is the identical 25-40 line boilerplate: build a `params` object with `useMemo`, construct a `Presenter` once with `useMemo`, `useState(presenter.vm)`, one `useEffect` to call `presenter.init(params)`, and one `useEffect` that does `autorun(() => setVm(presenter.vm))`. `grep -rl "return autorun"` finds 20 files with this exact block. This is a strong candidate for a single generic `usePresenter(props, PresenterClass, mapPropsToParams)` hook in `hooks/`.

The second major recurring pattern is the form-field wrapper: `Input.tsx`, `Textarea.tsx`, `CodeEditor.tsx`, `CheckboxGroup.tsx`, `RadioGroup.tsx` (and picker-slice `Select.tsx`) all destructure the same `label/description/hint/note/required/disabled/validation/validate/onBlur` props, compute `invalid`/`id`, wrap an async `onBlur` that calls `validate()`, and render the same `<div className="w-full"><FormComponentLabel/><FormComponentDescription/><Primitive/><FormComponentErrorMessage/><FormComponentNote/></div>` skeleton (e.g. `Input/Input.tsx:14-71` vs `Textarea/Textarea.tsx:15-70`, 19-25 line clones per jscpd). `FormComponent/Description.tsx` and `FormComponent/Note.tsx` are themselves near-identical (only `mb-sm` vs `mt-sm` and the exported name differ, 20-line clone).

Other confirmed but smaller items: `EmptyState/illustrations/*.tsx` (6 files) each redeclare very similar gradient/clipPath `<defs>` blocks (up to 33-line clones between `UploadIllustration`, `ListingIllustration`, `ContentIllustration`, `SelectIllustration`, `LayoutIllustration`, `TableIllustration`) — a shared gradients module would remove most of this. `Card/components/Icon.tsx` and `Widget/components/Icon.tsx` (navigation slice) are byte-identical 12-line wrappers. `utils.tsx`'s `omit` reimplements `lodash.omit`/`@webiny/utils` territory (minor, 10 callers, low priority). `CheckboxGroup/primitives/presenters/CheckboxGroupPresenter.test.ts` itself contains 4 internally duplicated test blocks (17-28 lines each), suggesting copy-pasted test cases that were never parameterized.

## Dead code

- `FillViewportWidth` (`FillViewport/FillViewport.tsx:93`) — codegraph shows only 2 callers, both barrel re-exports (`exports/admin/ui.ts`, `packages/webiny/src/admin/ui.ts`); no component anywhere in the monorepo actually renders `<FillViewportWidth>`. `FillViewportHeight` (line 92), by contrast, has one real consumer (`app-website-builder`'s `InsertElements.tsx`) plus the same two barrel exports, so only the "Width" variant looks unused. Confidence: medium (codegraph: no consumers found for the JSX usage).
- Duplicate barrel line for `HeaderBar` in `src/index.ts:29-30` (see Bugs #5) — harmless but should be removed.

## Convention issues

- `Textarea/Textarea.tsx:13` defines `type TextareaGroupProps = ...` (an internal type, not exported) whereas the parallel `Input/Input.tsx:12` defines and exports `InputProps`. The name `TextareaGroupProps` looks like a copy-paste leftover from `CheckboxGroup`/`RadioGroup` (there is no "group" concept for a single textarea), and its non-export is inconsistent with `Input`, `CodeEditor`, etc., which all export their `*Props` type. Low severity but worth a rename/export for API consistency.
- `src/index.ts` (the package's actual public entry per `package.json`'s `"exports"` mapping `"." -> "./index.js"`) uses `export *` for all ~55 subfolders, in contrast to the curated, symbol-by-symbol `exports/admin/ui.ts`. This means every internal type incidentally exported from a folder's own `index.ts` (e.g. any stray domain/mapper type someone adds later) becomes part of the package's real public surface, not just of the curated `exports/admin/ui.ts` list. Not an active problem today (the per-folder `index.ts` files audited here only re-export the primitive/component, not the mobx presenters or domain classes), but it's a structural risk given the "minimal barrel exports" convention, since nothing enforces the curated list stays in sync with `index.ts`.

## Test gaps

Only 7 `*.test.ts(x)` files exist in this slice's folders: `Checkbox`, `CheckboxGroup`, `RadioGroup`, `RangeSlider`, `Slider`, `Switch` presenters, and `SegmentedControl.test.tsx` (component-level). Notably untested despite being either widely consumed or the template other controls copy from:
- `Toggle`/`ToggleGroup` presenters and hooks — zero tests, even though `Switch`, `Slider`, `RangeSlider`, `CheckboxGroup`, `Checkbox`, `ColorPicker`, `MultiFilePicker`, `AutoComplete` all duplicate `useToggle`'s exact hook-wiring pattern from this file.
- `DelayedOnChange` (25 real consumers) — no test of the debounce/blur/Tab/Enter-flush behavior described in its own doc comment.
- `AdminUiProvider`'s `compileMarkdown` caching and `useAdminUi` guard-throw — untested.
- `CodeEditor`/`CodeEditorPrimitive` — untested, which is how the `defaultValue` staleness bug (Bug #1) went unnoticed.
- `Input`/`Textarea` wrapper components — the shared `onBlur`+`validate()` async flow and `id` generation are untested.
- `ProgressBarPresenter` is tested, but the `max === 0` / `value > max` edge cases from Bug #3 are not covered by the existing test file.

## Recommendations

1. Extract the ~20-times-repeated hook boilerplate (`params` useMemo → presenter useMemo → `useState(vm)` → init effect → autorun effect) into one generic `usePresenter` hook in `hooks/`, and likewise extract the repeated form-field wrapper skeleton (`FormComponentLabel`/`Description`/`Primitive`/`ErrorMessage`/`Note` + the `onBlur`/`validate`/`id`/`invalid` logic) into a shared `withFormField` helper or hook used by `Input`, `Textarea`, `CodeEditor`, `CheckboxGroup`, `RadioGroup`. This is the single highest-leverage cleanup in the slice — it collapses most of the 2492 duplicated jscpd lines in this package.
2. Fix `CodeEditor`'s `defaultValue={value}` (Bug #1) to a controlled `value` prop (or force a remount via `key`), since it silently shows stale JSON in at least the audit-logs Preview drawer today.
3. Add tests for `Toggle`/`ToggleGroup` (the template every other simple control copies) and for `DelayedOnChange`, and bound or key-scope `AdminUiProvider`'s markdown cache (e.g. an LRU or per-route reset) to remove the unbounded-growth risk in Bug #2.
