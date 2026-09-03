# One Public Function Per File

A file exports ONE function meant for other modules. Helpers used only by it live in the same file,
unexported. Don't group independent exported functions in one module because they feel related —
give each its own file and let a barrel (`index.ts`) group them.

This mirrors [one-class-per-file.md](./one-class-per-file.md): the file name should tell you what
you get.

```ts
// Bad — registerWebinyApi.ts: two independent lifecycle steps plus their shared types
export async function registerWebinyApiRoot(...) { /* ... */ }
export async function registerWebinyApiRequest(...) { /* ... */ }
```

```ts
// Good
// composition/registerWebinyApiRoot.ts
export async function registerWebinyApiRoot(...) { /* ... */ }

// composition/registerWebinyApiRequest.ts
export async function registerWebinyApiRequest(...) { /* ... */ }

// composition/types.ts        — shared types
// composition/index.ts        — barrel re-exporting the above
```

Composition steps, registration functions, and entry points ALWAYS get their own file.

Narrow exception: a module named for one coherent concept may export a few small, pure, low-level
helpers on that concept (e.g. `extractRequestAuth.ts` exporting header-parsing helpers). If the
functions differ in lifecycle, side effects, or who calls them, that's not this exception — split it.
