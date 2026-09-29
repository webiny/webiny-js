# @webiny/i18n-react

> Level 1 · commit 19c9ca1b91 · audited 2026-09-26

## Summary
A single-file (~80 line) React `Processor` plug-in for `@webiny/i18n`: it is registered alongside `@webiny/i18n`'s `defaultProcessor` and takes over translation rendering only when at least one interpolation value is a valid React element, wrapping the translated string in `<i18n-text>`/`<i18n-text-part>` custom elements so React nodes can be interpolated inline. Health is mediocre: the package has no tests at all, and its placeholder-substitution logic silently mishandles falsy interpolation values (0, "", false) — a real behavioral divergence from the sibling `default` processor in `@webiny/i18n`.

## Public API
- Default export `processor` (a `Processor` object: `name`, `canExecute`, `execute`) — `packages/i18n-react/src/index.tsx:55`. It has exactly one in-repo consumer: `packages/app/src/i18n/i18n.ts`, which does `i18n.registerProcessors([defaultProcessor, reactProcessor])` on the shared `@webiny/i18n` singleton used throughout the admin app.

## Bugs
| # | Severity | Location | Problem | Failure scenario | Confidence |
|---|---|---|---|---|---|
| 1 | medium | packages/i18n-react/src/index.tsx:35-37 | `processTextPart` checks `if (!values[variable])` (truthiness) to decide whether a placeholder was supplied, instead of checking key presence like the sibling `default` processor does (`packages/i18n/src/processors/default.ts:16-19`, `!keys.includes(variable)`). | Any translation that mixes a React-element value (which triggers `canExecute` to pick this processor) with a legitimately falsy value for another placeholder — e.g. `i18n.translate("You have {count} <icon/>", { count: 0, icon: <Icon/> })` — renders the literal placeholder name (`"count"`) instead of the value `0`. The same happens for `""`, `false`, and `null` values. | high |

## Duplication
`processTextPart` (packages/i18n-react/src/index.tsx:20-53) is a near line-for-line copy of `processTextPart` in `packages/i18n/src/processors/default.ts:4-37` (split translation string on `/({.*?})/`, trim braces, split on `|` for modifier name/params, look up value, apply modifier). The only substantive difference is the presence-check bug above; the "not found" fallback also differs cosmetically (bare variable name here vs. `{variable}` in the default processor). This duplicate implementation is exactly the kind of drift a shared helper (e.g. exported from `@webiny/i18n`) would have prevented. No jscpd clone was reported because jscpd was run per-package (jscpd-i18n-react shows 0 duplicated lines against itself); the duplication is cross-package.

## Dead code
None found — the sole export is consumed by `packages/app/src/i18n/i18n.ts`.

## Convention issues
None found. The file is small, single-purpose, and matches the one-file/one-concern convention; no inline type definitions of note (the JSX namespace augmentation for `i18n-text`/`i18n-text-part` custom elements is the expected pattern for custom elements, not an ad-hoc inline type).

## Test gaps
There are no tests anywhere in the package (no `__tests__` directory). Nothing exercises `canExecute`'s element-detection, the placeholder/modifier substitution, or the falsy-value bug above.

## Recommendations
1. Fix the truthiness check at packages/i18n-react/src/index.tsx:35-37 to check key presence (`variable in values` or `Object.keys(values).includes(variable)`) instead of `!values[variable]`, matching `@webiny/i18n`'s default processor semantics.
2. Add unit tests covering `canExecute` (mixed React-element/plain-value payloads) and `execute` (including a 0/""/false interpolation value), since there are currently zero tests for this processor.
3. Consider extracting the shared placeholder-parsing logic (split/trim/modifier-lookup) into `@webiny/i18n` so `i18n-react` and the `default` processor don't maintain two copies that can silently diverge, as they already have.
