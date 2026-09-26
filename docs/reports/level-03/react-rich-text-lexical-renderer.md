# @webiny/react-rich-text-lexical-renderer

> Level 3 · commit 19c9ca1b91 · audited 2026-09-26

## Summary
This is a tiny, standalone wrapper package meant for external (non-monorepo) React 18 apps that need to render Lexical rich-text JSON coming from Webiny Headless CMS or Form Builder: its single export, `RichTextLexicalRenderer`, forwards `value`/`theme`/`nodes` straight into `@webiny/lexical-editor`'s `LexicalHtmlRenderer`, and the `theme` prop is built with `@webiny/lexical-theme`'s `createTheme`. It correctly reuses both dependencies rather than reimplementing any theme or rendering logic. Health is good: the package is small (33 lines of source), has no clones, and has a reasonable direct test suite, though it has zero consumers inside this monorepo (it exists purely for external distribution) and its own `DEVELOPMENT.md` usage example is out of date.

## Public API
- `RichTextLexicalRenderer` (`src/index.tsx:31`) — the sole export; a thin wrapper around an internal `LexicalRenderer` component, which itself wraps `@webiny/lexical-editor`'s `LexicalHtmlRenderer`. No in-repo consumers found (grep for the package name across `packages/`/`apps/` outside its own directory returns nothing); it is published for use by external websites/apps built against Webiny Headless CMS/Form Builder output, per `DEVELOPMENT.md`.

## Bugs
| # | Severity | Location | Problem | Failure scenario | Confidence |
|---|---|---|---|---|---|
| 1 | low | `DEVELOPMENT.md:25` | The package's own usage example imports `{RichTextRenderer}` from `"@webiny/react-rich-text-renderer"` — both the import name and the package name are wrong; the actual export is `RichTextLexicalRenderer` from `@webiny/react-rich-text-lexical-renderer`. | An external developer copy-pasting the documented usage example verbatim gets a module-not-found error and has to reverse-engineer the correct names from `src/index.tsx`. | high |

## Duplication
None found within the package (jscpd report shows 0 clones across its 2 source files). No duplication of lower-level packages' logic was found; `createTheme`/`LexicalHtmlRenderer` are used as intended rather than reimplemented.

## Dead code
None found. The only export is used by the package's own test suite and is the package's entire reason for existing (external consumption, not in-repo).

## Convention issues
- `src/index.tsx:14-33` defines two components (`LexicalRenderer` and the exported `RichTextLexicalRenderer`) where the outer one only spreads props into the inner one, adding a layer of indirection with no behavioral difference; this is a minor style choice, not a functional issue, and is not flagged as a Bug.

## Test gaps
The existing `__tests__/lexical-renderer.test.tsx` suite covers the main paths well: string vs. JSON-object `value`, `null`/`undefined` handling, and a richer CMS payload (headings/paragraphs/lists/quotes) rendered through the configured theme. Not covered: the `nodes` prop (passing custom `Klass<LexicalNode>[]` through to `LexicalHtmlRenderer`) has no dedicated test, so a regression that silently drops custom node registration would not be caught here.

## Recommendations
1. Fix the package name and import name in `DEVELOPMENT.md`'s usage example (`RichTextRenderer` / `@webiny/react-rich-text-renderer` → `RichTextLexicalRenderer` / `@webiny/react-rich-text-lexical-renderer`), and update the stated React version (docs still reference v17.0.2 while `package.json` depends on React 18.3.1).
2. Add a test that passes a custom `nodes` array and asserts it reaches `LexicalHtmlRenderer`, to guard the one currently untested prop.
3. Consider collapsing the redundant `LexicalRenderer`/`RichTextLexicalRenderer` double-wrapper into a single component, since the split adds no behavior.
