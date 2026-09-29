# @webiny/lexical-nodes

> Level 1 · commit 19c9ca1b91 · audited 2026-09-26

## Summary
This package defines Webiny's custom Lexical node set (`wby-paragraph`, `wby-heading`, `wby-quote`, `wby-list`/`wby-list-item`, `wby-link`/`autolink`, `wby-image`, `wby-font-color`) plus the supporting formatting utilities (`formatToHeading`/`formatToParagraph`/`formatToQuote`, `formatList`'s indent/outdent/insert/remove-list machinery, `toggleLink`) and content-migration helpers (`prepareLexicalState`, `generateInitialLexicalValue`) that every Webiny Lexical-based editor (`lexical-editor`, `app-admin`, `app-headless-cms`, `app-website-builder`) is built on. Each rich-text node re-implements Lexical/`@lexical/rich-text`/`@lexical/list`/`@lexical/link` classes to add Webiny's theme-driven `styleId`/`className` typography (via `@webiny/lexical-theme`'s `Theme.from(config.theme)`), which is the main thing other packages should reuse rather than reinvent. Health is good overall — the code is a deliberate, well-scoped fork of upstream Lexical node classes — but there is one security finding tracked privately (SEC-1), a dead no-op fallback in `ListNode.importJSON`, and the package has zero dedicated tests of its own.

## Public API
- `allNodes` (`src/index.ts:44`) — the node/replacement list handed to `LexicalComposer`'s `nodes` option; consumed by `lexical-editor`'s default editor config and the CMS/website-builder/app-admin Lexical wrappers.
- Node classes `ParagraphNode`, `HeadingNode`, `QuoteNode`, `ListNode`, `ListItemNode`, `LinkNode`/`AutoLinkNode`, `ImageNode`, `FontColorNode` and their `$create*`/`$is*` helpers — `ListNode` alone has ~30 in-repo callers (e.g. `packages/app-admin/.../TypographyDropDown.tsx`, `packages/lexical-editor/.../BulletListAction.tsx`); `LinkNode`/`$isLinkNode` ~10 callers (`lexical-editor/src/plugins/LinkPlugin`, `FloatingLinkEditorPlugin`); `QuoteNode`/`HeadingNode` ~5-6 callers each; `FontColorNode` 6 callers; `ImageNode` 7 callers (`ImagesPlugin.tsx`). All node types are also exercised indirectly by `packages/lexical-converter/__tests__/stateTransformer.test.ts`.
- Formatting utilities `formatToHeading`, `formatToParagraph`, `formatToQuote`, `toggleLink`, `insertList`/`removeList`/`$handleIndent`/`$handleOutdent` (from `formatList.ts`) — each consumed by exactly one or two toolbar actions/plugins in `lexical-editor` (`TypographyPlugin.tsx`, `QuoteAction.tsx`, `LinkPlugin.ts`, list toolbar actions).
- `prepareLexicalState` / `generateInitialLexicalValue` (`src/prepareLexicalState.ts`, `src/generateInitialLexicalValue.ts`) — used by `lexical-converter`'s `createLexicalStateTransformer.ts` and `lexical-editor`'s `StateHandlingPlugin.tsx` to migrate old serialized node `type` strings and seed a blank editor value.
- `clearNodeFormatting` (`src/utils/clearNodeFormating.ts:7`) — exported from the barrel but has zero consumers anywhere in the monorepo (see Dead code).

## Bugs
| # | Severity | Location (file:line) | Problem | Failure scenario | Confidence |
|---|---|---|---|---|---|
| 1 | high | `src/LinkNode.ts` | Security finding SEC-1. See private security notes (`docs/.reports/security.md`, not committed). | — | high |
| 2 | medium | `src/ListNode.ts:120-126` (`importJSON`) | `serializedNode.styleId ?? serializedNode.styleId` is a self-referential nullish-coalescing expression — both sides are the same value, so the `??` is a no-op and the comment "`styleId` is for backwards compatibility" describes behavior the code doesn't implement. Every other typography node (`ParagraphNode.ts:153`, `HeadingNode.ts:187`, `QuoteNode.ts:119`) instead calls `getStyleId({ styleId: serializedNode.styleId, styles: serializedNode.styles })` to recover a `styleId` from the legacy `styles: ThemeStyleValue[]` array format described in `src/utils/getStyleId.ts:8-11`. `SerializedWebinyListNode` (`src/ListNode.ts:22-32`) has no `styles` field at all, so a list node serialized in the older array-based format cannot recover its `styleId` on import — it silently falls through to `setDefaultTypography` instead of the style the user picked. | Content authored/exported under the older "styles array" schema (the same legacy format `getStyleId` exists to handle for paragraphs/headings/quotes) that contains list blocks will lose their assigned typography style on import and silently render with the block's default typography instead. | medium |

## Duplication
jscpd reports 12 clones (193 lines) inside the package, all following one pattern: the five typography-aware node classes (`ParagraphNode`, `HeadingNode`, `QuoteNode`, `ListNode`, and to a lesser extent `ListItemNode`) each hand-roll the same `getStyleId`/`setStyleId`/`getClassName`/`setClassName` pair, the same `updateElementWithThemeClasses`/`setDefaultTypography` shape (look up typography by tag or by explicit `styleId` via `Theme.from(config.theme)`, then apply `addClassNamesToElement`), and the same `exportDOM` override that re-adds `this.__className` to the exported element:
- `ParagraphNode.ts:53-72,96-115,148-165` ~ `QuoteNode.ts:41-60,79-98,114-130`
- `HeadingNode.ts:73-96,112-126,182-198,225-256` ~ `ParagraphNode.ts:50-73,172-203` and `QuoteNode.ts:84-98,114-130`
- `ListNode.ts:81-95,188-203` ~ `QuoteNode.ts:84-98,136-150`
- `LinkNode.ts:282-293` ~ `ListItemNode.ts:373-384` (both are the boilerplate `getX/setX(writable)` accessor pattern)
- `toggleLink.ts:47-61` ~ `toggleLink.ts:81-95` (the single-node and multi-node branches of `toggleLink` repeat the same "set target/rel/title/alt" block)

This is boilerplate inherent to extending five different upstream Lexical base classes with the same theme-typography mixin; there is no shared base class or mixin/helper extracting the common `getStyleId`/`setStyleId`/`updateElementWithThemeClasses` logic, so any future change to how typography defaults are resolved (e.g. fixing Bug #2) has to be made in four separate places by hand.

At a larger grain, `src/utils/formatList.ts` and `src/utils/listNode.ts` are a near-total reimplementation of `@lexical/list`'s list-formatting algorithms (`insertList`, `removeList`, `mergeLists`, `$handleIndent`/`$handleOutdent`, `$getListDepth`, etc.), necessary because Webiny's `ListNode`/`ListItemNode` are separate classes (`wby-list`/`wby-list-item`) rather than the stock `@lexical/list` types, so the upstream functions' `$isListNode`/`$isListItemNode` checks don't recognize them. This is architecturally required duplication rather than an oversight, but it does mean upstream `@lexical/list` bug fixes/behavior changes won't automatically apply here.

## Dead code
- `clearNodeFormatting` (`src/utils/clearNodeFormating.ts:7`, re-exported from `src/index.ts:36`) has no callers anywhere in the monorepo outside its own definition (confirmed via repo-wide grep). It looks like a leftover public export from an unused toolbar action.

## Convention issues
- One-abstraction-per-file: `src/FontColorNode.ts` defines two classes, `ThemeColorValue` (lines 5-32) and `FontColorNode` (lines 55-160), in the same file. `src/LinkNode.ts` similarly defines both `LinkNode` (lines 55-296) and `AutoLinkNode` (lines 337-390) in one file. Both mirror how upstream Lexical structures these files, but they violate this repo's one-abstraction-per-file convention; `ThemeColorValue` in particular is a self-contained value object that could live in its own file.
- Minor filename inconsistency: `src/utils/clearNodeFormating.ts` misspells "Formatting" (missing a `t`) while the exported function name `clearNodeFormatting` is spelled correctly.

## Test gaps
- The package has no `__tests__` directory and zero unit tests of its own (3,802 lines of source). Coverage is entirely incidental, via `packages/lexical-converter/__tests__/stateTransformer.test.ts`, which round-trips `ParagraphNode`/`HeadingNode`/`QuoteNode`/`ListNode` through import/export JSON but does not exercise `createDOM`/`updateDOM` (so it would not have caught Bug #1), nor `ListItemNode`, `LinkNode`/`AutoLinkNode`, `ImageNode`, `FontColorNode`, or any of the `formatList.ts`/`toggleLink.ts`/`listNode.ts` mutation helpers.
- Security finding SEC-1 needs a regression test (see private notes). No test exists for `ListNode.importJSON`'s legacy-format handling.

## Recommendations
1. Fix security finding SEC-1 (See private security notes (`docs/.reports/security.md`, not committed).)
2. Fix `ListNode.importJSON`'s no-op `serializedNode.styleId ?? serializedNode.styleId` (`src/ListNode.ts:124`) to use `getStyleId({ styleId: serializedNode.styleId, styles: serializedNode.styles })` (extending `SerializedWebinyListNode` with an optional `styles` field) for parity with the other typography nodes, and add a regression test importing a legacy `styles`-array list node.
3. Add a minimal `__tests__` suite for this package covering `createDOM`/`updateDOM` for each typography node (not just import/export JSON), `toggleLink`, and `formatList.ts`'s indent/outdent/insert/remove-list functions, since none of these are exercised anywhere in the monorepo today.
