# `check:test:types` discards type errors from every test that lives under `src/`

> **Package:** `scripts/typecheckTests`
> **Severity:** medium — the check reports a pass for files it actually compiled and found errors in.
> A type-level test placed where the repo's own test pattern says tests may live is silently not
> enforced.

## Summary

`typecheckPackage` compiles the package with an `include` of `["__tests__", "src"]`, so tests under
`src/` **are** typechecked — and then filters the compiler's output down to one directory
(`scripts/typecheckTests/typecheckPackage.ts`):

```ts
const testsPrefix = `${folderName}/__tests__/`;
...
return output
    .split("\n")
    .filter(line => line.includes(testsPrefix) && line.includes("error TS"))
    .join("\n");
```

Any error in `src/**/*.test-d.ts` or `src/**/*.test.ts` is compiled, matched, and thrown away.

This contradicts the repo's own test pattern, which explicitly covers both locations
(`testing/vitest.project.ts`):

```ts
export const testPattern = `/{__tests__,src}/**/*.{test,test-d}.[jt]s?(x)`;
```

So `yarn test` runs tests in `src/`, and `yarn check:test:types` silently does not check them.

## Measured

A `.test-d.ts` file asserting that the component editor cannot write a bundle, with a deliberately
broken door (a `bundledJs?: string` added back to the gateway's update input):

| Test file location           | `tsc` directly                | `yarn check:test:types`                  |
| ---------------------------- | ----------------------------- | ---------------------------------------- |
| `src/admin/features/shared/` | 2 errors (`TS2344`, `TS2578`) | **`✔ ✔ @webiny/remote-components`**      |
| `__tests__/`                 | 2 errors                      | `✖ @webiny/remote-components — 2 errors` |

Same file, same errors, same compiler. Only the path differs.

It also hid a second thing: the file's first draft used
`expectTypeOf<T>().not.toHaveProperty("x")`, which in this vitest version is a type error
(`TS2554: Expected 2 arguments, but got 1`) — meaning those assertions asserted nothing. The suite
passed `yarn test` and `check:test:types` in that state. A type assertion that does not compile is
not a weaker assertion, it is no assertion, and this is exactly the case the check exists to catch.

## Worked around, not fixed

The test was moved to `packages/remote-components/__tests__/editorCannotWriteBundles.test-d.ts`,
where it is enforced. Verified in both directions: clean with the door shut, two reported errors with
it open.

## Fix sketch (not implemented)

Widen the filter to the package folder rather than its `__tests__` subdirectory, so the report
matches what was compiled and what `testPattern` claims. Doing that will surface pre-existing errors
in packages that currently have tests under `src/` — the run already reports 756 errors across 43
packages from `__tests__` alone — so it is a decision about how much to turn on at once, not a
one-line change to make in passing.
