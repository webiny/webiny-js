# @webiny/form

> Level 1 · commit 19c9ca1b91 · audited 2026-09-26

## Summary
`@webiny/form` is the MVP-ish form framework used throughout the admin app: a MobX-backed `FormPresenter`/`FormAPI` pair drives a `<Form>` component and a `<Bind>`/`useBind` render-prop API that lets any input component register itself as a field (with validators, `beforeChange`/`afterChange` hooks, and `before`/`after`-less priority-free ordering — unlike `react-properties`, fields here are a flat name→`FormField` map keyed by dotted path). It is heavily used (~78 files import `@webiny/form` outside the package itself, across `app-admin`, `app-headless-cms`, `app-aco`, `app-website-builder`, etc.). Core validation, submit, and data-binding paths are reasonably well tested, but two real correctness bugs were found: a stale-closure race in default-value assignment, and — more seriously — a validation-result cache that can let an already-invalid field silently pass `form.validate()` after a programmatic `setValue()` call.

## Public API
- `Form`, `Bind`, `useBind`, `useForm`, `BindPrefix`/`useBindPrefix`, `UnsetOnUnmount`, `useGenerateSlug`, plus the `FormAPI`/`BindComponentProps`/etc. types (packages/form/src/index.ts) — consumed across ~78 files repo-wide; the dominant pattern is `<Form data={...}>{({ Bind, data, submit }) => (<Bind name="x">{bind => <Input {...bind} />}</Bind>)}</Form>`.
- `FormPresenter` (internal state/validation orchestration) and `FormAPI` (the object handed to consumers as `form`) are the two core classes; `FormAPI.setValue`/`getValue`/`validate`/`validateInput`/`submit` are the programmatic surface used by hooks like `useGenerateSlug` and components like `UnsetOnUnmount`.
- Uses `@webiny/validation`'s `Validator` type directly (no reimplementation) and `@webiny/react-composition`'s `makeDecoratable` to make `useBind` itself decoratable — both dependencies used correctly, no misuse found.

## Bugs
| # | Severity | Location | Problem | Failure scenario | Confidence |
|---|---|---|---|---|---|
| 1 | high | packages/form/src/FormValidator.ts:52-58 | `validateField`'s `shouldValidate` check trusts the field's *cached* `field.isValid()` result (set by the last time `field.validate()` ran) to decide whether to skip re-validating: `shouldValidate = !hasValue \|\| (hasValue && isFieldValid !== true)`. If a field currently has a value and its cache says `isValid === true`, the field is reported valid without re-checking the current value at all. Nothing invalidates that cache when the value subsequently changes outside of `field.validate()` — in particular, `FormAPI.setValue` (packages/form/src/FormApi.ts:121-123) calls `presenter.setFieldValue` directly and never touches the field's cached validation state. | A field is validated once (e.g. on first submit) with a valid value, then some code path calls `form.setValue(name, invalidValue)` directly — this is exactly what the package's own `useGenerateSlug` hook does (packages/form/src/useGenerateSlug.ts:20-28), and it's the same API exposed to every consumer via `children({ setValue, ... })` in Form.tsx:133. A second `form.validate()`/submit afterwards will report the field as valid (skipping `field.validate()` entirely) even though its current value would fail the configured validators, letting invalid data through to `onSubmit`. | high |
| 2 | medium | packages/form/src/FormPresenter.ts:176-182 | `registerField` reads `currentFieldValue = lodashGet(this.data, fieldName)` synchronously, then defers the actual default-value assignment to a `requestAnimationFrame` callback that re-checks `emptyValues.includes(currentFieldValue)` — the *stale, closed-over* value from registration time, not the live value at the time the callback fires. | If anything sets the field's real value between registration and the next animation frame (e.g. a sibling field's `onChange`/effect calling `form.setValue(thisField, x)` synchronously after mount, a common "derive one field from another" pattern), the deferred callback still sees the old "empty" snapshot and unconditionally overwrites `this.data[fieldName]` with `defaultValue` via `lodashSet`, clobbering the value that was just set. | high |

## Duplication
No internal clones (jscpd: 0 duplicated lines across 18 source files). Minor structural duplication in `packages/form/src/types.ts`: `BindComponentRenderPropValidation` (line 8), `Validation` (line 88), and the inline `validation` object type inside `FormComponentProps` (lines 127-134) all define the same `{ isValid, message?, results?, context? }` shape three separate times instead of reusing one named type.

## Dead code
None found — every export checked (`FormComponentProps`, `Bind`, `useGenerateSlug`, `UnsetOnUnmount`, etc.) has confirmed in-repo consumers.

## Convention issues
`FormComponentProps.validation` (packages/form/src/types.ts:127-134) is an inline object type rather than a reference to the already-exported `BindComponentRenderPropValidation`/`Validation` interface it duplicates — a minor violation of the "no inline types" convention, and the root cause of the triple-duplication noted above.

## Test gaps
`FormPresenter.test.ts` covers registration, single/whole-form validation, `skipValidators`, `setInvalidFields`, `onChange`/`onInvalid` callbacks, and `setData`, but nothing exercises: (a) re-validating a field after its cached `isValid` was already `true` and the value changed via `setFieldValue`/`setValue` without an intervening `validateField` call (would have caught Bug #1); (b) the `requestAnimationFrame`-deferred default-value assignment in `registerField` at all — there is no test for `defaultValue` behavior in `FormPresenter.test.ts`, and none of it uses fake timers/rAF mocking (would have caught Bug #2). The React-level `form.test.tsx` suite was not re-audited in depth here since the presenter/validator layer is where the two confirmed defects live.

## Recommendations
1. Fix `FormValidator.validateField` (or `FormField`) to invalidate/ignore the cached `isValid` whenever the field's value has changed since the last validation, so a stale "valid" cache can never mask a currently-invalid value on a later `form.validate()`/submit call. This is the highest-priority fix since it affects data integrity on submit.
2. In `FormPresenter.registerField`, re-read the field's current value inside the deferred `requestAnimationFrame` callback (instead of using the value captured at registration time) before deciding whether to apply `defaultValue`.
3. Consolidate the three duplicate validation-result shapes in `types.ts` into the single `Validation`/`BindComponentRenderPropValidation` type and reference it from `FormComponentProps`.
