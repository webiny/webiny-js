# The API build statically inlines the build machine's absolute filesystem paths into the deployed handler

> **Package:** API build pipeline (observed in `.webiny/workspace/apps/api/graphql/build/_handler.mjs`)
> **Severity:** raised to **high** — this stopped being theoretical. In W2 it took the whole dev
> API down: every request returned `Internal Server Error` and the Lambda never finished importing
> its handler. Whether an instance is harmless or fatal depends entirely on whether the inlined path
> is _used_, and nothing at build time distinguishes the two.

## Summary

`import.meta.url` is resolved at build time and baked into the bundle as a literal absolute path from
the machine that ran the build. The deployed handler therefore contains strings like:

```
/Users/svenalhamad/Dev/webiny-js-migration-tool/packages/remote-components/dist/api/bundler/bundleComponent.js
file:///Users/svenalhamad/Dev/webiny-js-migration-tool/node_modules/@puppeteer/browsers/node_modules/yargs/lib/platform-shims/esm.mjs
```

Neither path exists in Lambda.

## It is general, not one bad line

Two distinct sources in the current bundle, one ours and one third-party, which is what makes it a
build behaviour rather than a mistake in a single file:

1. **Ours** — `polyfillCjsGlobals()` in
   `packages/remote-components/src/api/bundler/bundleComponent.ts:128-135` derives `__filename` and
   `__dirname` from `import.meta.url` to satisfy CJS-style globals:

   ```ts
   g.__filename = fileURLToPath(import.meta.url);
   g.__dirname = dirname(g.__filename);
   ```

   In the bundle, `import.meta.url` has become the build machine's path, so `__filename` and
   `__dirname` point at a directory that does not exist on the Lambda.

2. **Third-party** — `@puppeteer/browsers`' vendored `yargs` does the same thing and gets the same
   treatment.

So any dependency using the `import.meta.url` → `fileURLToPath` idiom contributes one of these.

## Why it has not caused a failure

In our case the polyfilled values are never read for anything that matters — they exist so that code
expecting CJS globals does not throw on reference. The wrong value is as good as the right one here.

That is luck rather than design. The idiom's normal purpose is locating a file relative to the module,
and anything doing that would silently look in a path that does not exist.

## Why it is still worth looking at

- **Information disclosure, mild.** The artifact names a developer's home directory, the project
  checkout path, and the dependency layout. It is not a secret, but it is gratuitous.
- **Reproducibility.** Two machines building the same commit produce different bytes, so the bundle is
  not content-addressable and build outputs cannot be compared across machines or CI.
- **It sets a trap.** The next dependency — or the next piece of our own code — that uses
  `import.meta.url` to find a real file will fail in deployment and pass locally, which is the worst
  shape of bug to debug.

Worth noting in context: the bundler this was found in **cannot currently run in Lambda anyway**,
because `esbuild.wasm` (13.3 MB) is not shipped in the API bundle and the limit is 8 MiB. See
`plans/server-side-component-bundling-investigation.md`. So the wrong `__dirname` has never been
exercised in a deployed environment.

## Mechanism, identified

The original write-up said the build "resolves `import.meta.url` at build time" without explaining
why. It is two settings interacting, and the distinction matters because one of them is load-bearing
for other work.

`createRsbuildConfig.js:86-89` sets:

```js
node: { __dirname: "node-module", __filename: "node-module" }
```

with the comment that ESM output has no `__dirname`/`__filename`, and some bundled dependencies read
them at module load — `@puppeteer/browsers` → `yargs` throws without it. `"node-module"` makes rspack
derive both from `import.meta.url`.

For a module that has been **bundled into a chunk**, `import.meta.url` no longer has a meaningful
runtime value — the module is not a file any more — so rspack substitutes the original source path as
a literal. That is where the build-machine path comes from.

**This does not apply to the `new URL("./asset", import.meta.url)` pattern**, which rspack recognises
separately and compiles to a runtime expression:

```js
__webpack_require__.b = new URL("./", import.meta.url);        // computed at runtime
const url = new URL(<hashed asset name>, __webpack_require__.b);
```

Verified by building a fixture through rsbuild with the API function's real output options and running
it from an unrelated working directory: it resolved to its own directory and read the asset. So asset
location via that pattern is unaffected by this issue, and the two should not be conflated.

## The first-party instance goes away on its own

Recorded here so it is not rediscovered later and re-investigated from scratch.

The decision has been taken to replace `esbuild-wasm` with Babel on the server bundling path. When
that lands, `polyfillCjsGlobals()` goes with it — it exists only to satisfy esbuild-wasm's CJS-style
globals, and Babel needs neither `__filename` nor `__dirname`. **Our** contribution to this issue
therefore disappears without anyone fixing it.

What remains is the third-party instance: `@puppeteer/browsers`' vendored `yargs`, which uses the same
`import.meta.url` → `fileURLToPath` idiom and gets the same build-time literal. So after the Babel
swap:

- the "it sets a trap for our own code" argument weakens considerably
- the reproducibility and mild-disclosure arguments stand unchanged, because the build behaviour is
  unchanged — it is the general handling of `import.meta.url`, not one dependency
- the remaining instance is in code we do not own, so the only lever is the bundler configuration

That probably lowers the priority rather than closing the issue. Worth a deliberate decision either
way, since the reason it looked urgent — our own bundler depending on it — will no longer apply.

## Suggested direction

Not investigated. Options, roughly in order of how targeted they are:

- Configure the API bundler to rewrite `import.meta.url` to a runtime-relative expression rather than
  a build-time literal, so the idiom resolves correctly wherever the bundle runs.
- Stop depending on it in our own code — `polyfillCjsGlobals` could set `__filename`/`__dirname` to a
  stable placeholder, since nothing reads them meaningfully.
- Leave it, and record the decision, so the next person who finds a home directory in a deployed
  artifact does not re-investigate it.

## How it was found

Reading the deployed handler while investigating whether the server-side bundler can run in Lambda.

## It became fatal in W2

Bringing `css-tree` onto the server path (the shared bundler derivation scopes CSS with it) broke
the deployed API outright:

```
Runtime.ImportModuleError: Error: Cannot find module '../data/patch.json'
Require stack:
- /Users/svenalhamad/Dev/webiny-js-migration-tool/node_modules/css-tree/lib/data-patch.js
```

**Every guard passed.** This is the part worth keeping:

| Guard                                                | Result                                        |
| ---------------------------------------------------- | --------------------------------------------- |
| `yarn build -p @webiny/remote-components`            | succeeded                                     |
| API function build with `enforceMaxBundleSize: true` | succeeded, 6.75 MiB against an 8 MiB limit    |
| `yarn test packages/remote-components`               | 29 passed                                     |
| All 118 stored components bundled locally            | 118/118, output properties verified           |
| `yarn lint`, `yarn adio`, format                     | clean                                         |
| Deployed invocation                                  | **every request 500, handler never imported** |

Nothing available before deploying distinguished a working bundle from one that could not start.

`css-tree/lib/data-patch.js` is:

```js
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const patch = require("../data/patch.json");
```

rspack cannot follow a `createRequire` + relative `require`, so it emitted the call with the build
machine's `import.meta.url` inlined. In Lambda that directory does not exist, so the module failed
during **import**, before the handler served a request. The build succeeded, the bundle size was
fine, and every local test passed.

### The distinction that matters

The two instances behave differently, and the difference is not visible at build time:

| Instance                         | Shape                                                    | Outcome                               |
| -------------------------------- | -------------------------------------------------------- | ------------------------------------- |
| `@puppeteer/browsers` yargs shim | `try { fileURLToPath(...) } catch { h = process.cwd() }` | Degrades quietly; harmless            |
| `css-tree` `data-patch.js`       | Top-level `require` of a path that must exist            | Handler never imports; API fully down |

So "inlined path present" is not by itself a defect, and the low severity was right for the instances
that existed then. What is missing is anything that catches the fatal shape.

### Worked around, not fixed

The shared derivation now imports css-tree's narrow entry points — `css-tree/parser`,
`css-tree/walker`, `css-tree/generator`, `css-tree/utils` — which do parse/walk/generate without
reaching the lexer's syntax data, and therefore never reach `data-patch.js`. Traced: 101 modules
reached, none of them `data.js` or `data-patch.js`. Output is byte-identical, which the conformance
test pins.

That fixes this dependency. It does not fix the next one.

## Suggested guard (not implemented)

A build-time check over the emitted handler for an inlined absolute path that is **not** inside a
`try`/`catch` — or, more simply, a smoke check that the deployed handler can be imported at all.

## The standing rule this is the second case for

The first was the NODE_PATH simulation during the Lambda-layer investigation, where local resolution
behaviour did not predict Lambda's. This is the second, and it cost a live API rather than a wrong
conclusion.

**Anything touching module resolution is verified by a deployed invocation, not locally.** Local
success is not evidence; it is the state that preceded both failures. This sits alongside the rule
about validating the result rather than an intermediate: here every intermediate was green and the
result was a dead handler.
