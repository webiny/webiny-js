# @webiny/validation

> Level 0 · commit 19c9ca1b91 · audited 2026-09-26

## Summary

`@webiny/validation` is a small, dependency-free (aside from lodash) string-rule validation
library: a `Validation` class holds a registry of named validator functions (`required`,
`email`, `gt`/`gte`/`lt`/`lte`, `minLength`/`maxLength`, `dateGte`/`dateLte`, `timeGte`/`timeLte`,
`url`, `slug`, `password`, `phone`, `creditCard`, `json`, `integer`, `number`, `numeric`, `in`,
`eq`), and callers describe rules as a comma-separated string (e.g. `"required,minLength:3"`)
that gets parsed and run sequentially, throwing/returning a `ValidationError`. It is exported
as a preconfigured singleton (`validation`), plus the `Validation` class, `ValidationError`
class, and a `Validator` function type others reimplement field validators against. The package
is well tested and mechanically simple; the only real risks are a handful of small edge cases in
individual validators and a latent design flaw in the (currently unused) multi-instance case of
`create`/`createSync`. Higher-level packages should reuse `validation.validate`/`validateSync`
and the `Validator` type rather than re-implementing string-rule parsing or ad hoc regexes for
email/URL/slug/phone/credit-card checks.

## Public API

- `validation` (singleton `Validation` instance, `src/index.ts:27`) — the main entry point,
  used via `validation.validate(value, "rule,rule:arg")` / `validation.validateSync(...)`.
  Imported directly (`import { validation } from "@webiny/validation"`) in 42 files across the
  monorepo (forms, cognito/self-hosted-auth password/sign-in screens, app-headless-cms,
  app-scheduler, app-workflows, app-aco, app-website-builder, api-headless-cms field validators,
  api-file-manager upload payload helpers, etc.).
- `Validation` class and `ValidationError` class (both re-exported from `src/index.ts:53`) —
  `Validation` lets a caller register custom validators via `setValidator`; only the singleton
  instance is constructed anywhere in this monorepo (grep for `new Validation(` finds exactly
  one hit, `src/index.ts:27`). `ValidationError` is imported directly by 5 files, e.g.
  `packages/app-scheduler/src/presentation/scheduleDialog/createMinDateValidator.ts` builds its
  own ad hoc validator against this same error type.
- `Validator` type (`src/types.ts:12`, imported via the `@webiny/validation/types.js` subpath) —
  used by 5 files, notably `packages/form/src/FormFieldValidator.ts` and
  `packages/form/src/types.ts`/`FormField.ts`, which type field-level validator arrays against it
  and rely on the optional `validatorName` property (set by `setValidator`, `src/validation.ts:54`)
  to support skipping validators by name.
- Individual validator modules (`src/validators/*.ts`) are internal implementation detail: none
  are imported directly anywhere else in the monorepo (only registered into the singleton via
  `src/index.ts`), so they are effectively private despite being resolvable through the package's
  `"./*": "./*"` subpath export.

## Bugs

| # | Severity | Location | Problem | Failure scenario | Confidence |
|---|----------|----------|---------|-------------------|------------|
| 1 | low | `src/validators/dateGte.ts:22-24`, `src/validators/dateLte.ts:22-24` | When the comparison parameter (`gteValue`/`lteValue`) is not a parseable date string, `new Date(gteValue)` produces an `Invalid Date`, and the subsequent `gteDate.toISOString()` call throws a `RangeError: Invalid time value` instead of producing the intended validation message. Confirmed with a direct Node repro. | A CMS content model field configured with `dateGte`/`dateLte` validator settings whose `value` is not a real date (e.g. a typo, or a template placeholder that wasn't substituted) will, on every validation attempt, surface the generic message `"Invalid time value"` (still wrapped in a `ValidationError` by `Validation.validate`'s own try/catch, so it does not crash the process) instead of a message naming the bad configured value. Callers such as `packages/api-headless-cms/src/features/validation/validators/DateGteValidator.ts` further swallow the message via `.catch(() => false)`, so the field is simply always reported invalid with no diagnostic for the admin who misconfigured it. | high |
| 2 | low | `src/validation.ts:17-20, 144-160` | `createdValidators` (the cache backing `Validation.prototype.create`/`createSync`) is a **module-level** singleton keyed only by the validator-rule string, not per `Validation` instance. If a second `Validation` instance were constructed (the class is publicly exported) and registered a different validator under the same name, calling `.create("thatRule")` on it would return the first instance's cached closure (bound to the first instance via `this.validate`), silently validating with the wrong validator set. | Currently unreachable in this monorepo — grep confirms only one `Validation` instance is ever created (the exported singleton) — but it is a live bug in the publicly exported `Validation` class the moment any consumer does `new Validation()` and calls `create`/`createSync` with a rule string that collides with another instance's. | medium |

## Duplication

Within the package (per jscpd, `min-lines`/`min-tokens` defaults):
- `src/validators/maxLength.ts:4-19` and `src/validators/minLength.ts:4-19` (16 duplicated lines) — identical length-resolution logic (`has(value, "length")` / `isObject` + `keys().length`), differing only in the comparison operator and error text.
- `src/validators/lt.ts:1-9` and `src/validators/lte.ts:1-9` (9 duplicated lines) — identical parse/compare scaffolding.
- `src/validation.ts:81-95` and `src/validation.ts:118-132`, and `src/validation.ts:95-113` and `src/validation.ts:132-144` — `validate` and `validateSync` are near-identical copies (the only difference is `await validator(...)` vs `validator(...)`), together ~28 duplicated lines.

Not flagged by jscpd (below its size threshold) but structurally the same pattern, worth folding into one place if this package is touched again: `gt.ts`/`gte.ts` mirror `lt.ts`/`lte.ts`; `dateGte.ts`/`dateLte.ts` are near-identical to each other, as are `timeGte.ts`/`timeLte.ts`.

No duplication of another package's logic or of a standard-library utility was found; the hand-rolled email/URL/slug/phone/credit-card regexes are validators JS/lodash do not provide out of the box.

## Dead code

None found. All 23 validator files are registered in `src/index.ts` and reachable through the singleton; `Validator.validatorName` (set in `src/validation.ts:54`) is consumed by `packages/form/src/FormFieldValidator.ts`'s `skipValidators` filtering.

## Convention issues

This package predates the DI/`createImplementation` pattern used elsewhere in the monorepo (it is a plain class + factory functions), so DI-naming and namespace-type conventions do not apply here. Barrel export in `src/index.ts` is minimal and appropriate — it exports only `Validation`, `ValidationError`, and the preconfigured `validation` instance, not the internal validator implementations. No inline object-type violations were found; `types.ts` and `validation.ts` define named interfaces (`Validator`, `ValidateOptions`, `ParsedValidators`, `CreatedValidators`) rather than inlining them. No convention violations worth flagging.

## Test gaps

- No test exercises `dateGte`/`dateLte` (or the related CMS `DateGteValidator`/`DateLteValidator`) with a malformed comparison value, so the `RangeError`-via-`toISOString()` path (Bug #1) is untested.
- No test exists for the `create`/`createSync` module-level cache behavior across multiple `Validation` instances (Bug #2); all existing `create.test.js` coverage only exercises the singleton.
- `password.ts` is only tested with numeric-length boundaries (`packages/validation/__tests__/password.test.js`); there is no test for a password value containing a newline, where the `new RegExp("^.{n,}$")` (no `s` flag) would undercount length since `.` does not match `\n`.

## Recommendations

1. Fix `dateGte`/`dateLte` to validate/guard the parsed comparison date before calling `.toISOString()` (e.g. check `isNaN(gteDate.getTime())` and throw a clear `ValidationError` naming the bad configured value), and add a regression test for a malformed `dateGte`/`dateLte` parameter.
2. De-duplicate the `gt`/`gte`/`lt`/`lte` and `dateGte`/`dateLte`/`timeGte`/`timeLte` and `minLength`/`maxLength` pairs, and the `validate`/`validateSync` bodies in `src/validation.ts`, behind one shared comparator/length-resolver helper — this is pure mechanical duplication with no behavioral differences beyond the operator and message text.
3. Either scope `createdValidators` per `Validation` instance (e.g. as an instance field instead of a module-level object) or document/enforce that only a single `Validation` instance may exist, to remove the latent cross-instance cache collision in `create`/`createSync`.
