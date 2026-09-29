# @webiny/lexical-converter

> Level 2 · commit 19c9ca1b91 · audited 2026-09-26

## Summary
A small, focused Node/browser-compatible package that converts between HTML and Webiny's Lexical editor state: `createHtmlToLexicalParser` parses an HTML `Document` into a serialized Lexical state using `@webiny/lexical-nodes`' `allNodes`, and `createLexicalStateTransformer` does the reverse (state -> HTML, or state -> per-top-level-node HTML fragments via `flatten`), post-processing generated HTML with `cheerio` to unwrap `<b>` tags. It is well tested (two ~300-440 line test suites covering paragraphs, headings, lists, links, quotes, code and both JSDOM/browser DOM paths) and has no jscpd duplicates. Health is good; the only points of note are one dead exported type and a stale usage example in `DEVELOPMENT.md`.

## Public API
- `createHtmlToLexicalParser(config?)` (`src/createHtmlToLexicalParser.ts:12`) — ~3 in-repo callers: `packages/ai-powerups/src/api/features/WbTranslatePage/LexicalParser.ts`, `packages/app-admin/src/components/LexicalEditor/lexicalValueFromHtml.ts`, `packages/app-admin/src/presentation/textToLexicalTool/textToLexicalState.ts`.
- `createLexicalStateTransformer(config?)` (`src/createLexicalStateTransformer.ts:76`), returning `.toHtml()` / `.flatten()` — ~2 in-repo callers: `packages/app-admin/src/components/LexicalEditor/lexicalValueWithHtml.ts`, `packages/app-admin/src/presentation/textToLexicalTool/textToLexicalState.ts`.
- Re-exported `SerializedEditorState` (from `lexical`) and the `FlatStateWithHTML` type (see Dead code).

## Bugs
| # | Severity | Location | Problem | Failure scenario | Confidence |
|---|---|---|---|---|---|
| — | — | — | None found. | — | — |

No confirmed logic bugs. One low-confidence observation not rising to a reportable bug: in `createHtmlToLexicalParser.ts:34-41`, only the `selection.insertNodes(lexicalNodes)` call is wrapped in try/catch — if `config.nodeMapper` throws while mapping nodes (`src/createHtmlToLexicalParser.ts:26-28`), the exception is not caught by this package's own code and its visibility to the caller depends on Lexical's internal `editor.update()` error handling (no `onError` is configured via `createHeadlessEditor`). This could not be confirmed as an actual production issue without deeper Lexical internals tracing, so it is omitted from the table.

## Duplication
None within the package (jscpd report for `lexical-converter` has zero duplicates). No duplication against `lexical-nodes` or the standard library was found; the package correctly delegates node construction to `@webiny/lexical-nodes`'s `allNodes` rather than reimplementing it.

## Dead code
- `FlatStateWithHTML` (`src/createLexicalStateTransformer.ts:12`) is exported from the package's public barrel (`src/index.ts` re-exports everything from `createLexicalStateTransformer.js`) but has no consumers outside its own declaring file (`grep` across `packages/` found only the declaration and its one internal use at line 28; codegraph confirms no external references). Low severity — an unused public type export, not unreachable logic.

## Convention issues
- `packages/lexical-converter/DEVELOPMENT.md` documents a `normalizeTextNodes` config option (`normalizeTextNodes: false // Default: true`) in its usage example (line 93) that does not exist on `ParserConfigurationOptions` (`src/types.ts:5-8`, which only has `editorConfig` and `nodeMapper`). This is a stale/incorrect usage example that could mislead consumers into thinking the option is supported.
- No other AGENTS.md convention violations found — the package is small, each file has a single clear responsibility, and there are no inline object type definitions of note.

## Test gaps
- No tests exercise `config.editorConfig` (custom `nodes`/`theme` passed through to `createHeadlessEditor`) or `config.nodeMapper` on `createHtmlToLexicalParser` — only the default configuration is tested in `__tests__/htmlToLexicalState.test.ts`.
- `postProcessHtml`'s `<b>`-unwrapping behavior (`src/postProcessHtml.ts:7-9`) is only exercised indirectly through full `toHtml`/`flatten` fixtures that don't contain a `<b>` tag in the mocks reviewed; there's no direct unit test asserting this specific transform.

## Recommendations
1. Fix or remove the `normalizeTextNodes` option from `DEVELOPMENT.md`'s example — it doesn't exist in the code and will confuse integrators.
2. Remove the unused `FlatStateWithHTML` export, or if it's meant as a public convenience type for consumers of `.flatten()`, verify intent and add a note/test showing it in use.
3. Add a focused unit test for `postProcessHtml`'s `<b>` → unwrap behavior and for `nodeMapper`/custom `editorConfig` pass-through, since these are the package's main extension points.
