# Common Dependencies - Alternatives

## accounting

Status: replace
Use `Intl.NumberFormat` (built-in). No dependency needed.

```js
new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(1234.56);
```

## adio

Status: ok

## apollo-cache, apollo-cache-inmemory, apollo-client, apollo-graphql, apollo-link, apollo-link-batch-http, apollo-link-context, apollo-link-error, apollo-link-http-common, apollo-utilities

Status: replace
All Apollo v2 packages. Replace with single `@apollo/client` v3+.
https://www.apollographql.com/docs/react/migrating/apollo-client-3-migration

## @babel/code-frame, @babel/compat-data, @babel/core, @babel/helper-define-polyfill-provider, @babel/helper-environment-visitor, @babel/parser, @babel/plugin-proposal-throw-expressions, @babel/plugin-transform-modules-commonjs, @babel/plugin-transform-runtime, @babel/preset-env, @babel/preset-react, @babel/preset-typescript, @babel/register, @babel/runtime, @babel/template, @babel/traverse, @babel/types

Status: ok
Standard toolchain. SWC is faster but migration is large.

## babel-plugin-dynamic-import-node

Status: replace
Native ESM dynamic `import()` works in Node 22+. No polyfill needed.

## babel-plugin-macros

Status: ok

## babel-plugin-module-resolver

Status: ok

## boolean

Status: replace
Inline: `val === "true" || val === "1"`. No package needed.

## bson-objectid

Status: replace
Use `crypto.randomUUID()` (built-in) or `nanoid` (already in deps).

## bytes

Status: ok

## cache-control-parser

Status: ok

## chalk

Status: ok

## cheerio

Status: ok

## ci-info

Status: ok

## classnames

Status: replace
Use `clsx` (already in deps). Same API, smaller, faster.

## cli-table3

Status: ok

## clsx

Status: ok

## @commitlint/cli, @commitlint/config-conventional

Status: ok

## core-js

Status: reduce
Node 22+ has most ES features natively. Audit actual polyfill usage.

## cross-env

Status: replace
Node 22+ supports `--env-file`. For scripts, use `dotenv` or inline env.

## cross-fetch

Status: replace
`fetch` is built-in since Node 18. Remove entirely.

## crypto-hash

Status: replace
Use `crypto.subtle.digest()` (built-in, works in both browser and Node).

```js
const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(data));
const hash = Array.from(new Uint8Array(buf))
  .map(b => b.toString(16).padStart(2, "0"))
  .join("");
```

## dataloader

Status: ok

## date-fns

Status: ok

## dayjs

Status: reduce
Both `date-fns` and `dayjs` are in deps. Pick one. `date-fns` is already tree-shakeable and more widely used.

## debounce

Status: ok

## deep-equal

Status: replace
Use `node:util` `isDeepStrictEqual` (Node) or `JSON.stringify` comparison for simple cases.

```js
import { isDeepStrictEqual } from "node:util";
```

## deepmerge

Status: ok

## dot-object

Status: ok

## dot-prop

Status: ok

## dot-prop-immutable

Status: replace
Use `structuredClone()` + `dot-prop` (already in deps).

```js
const copy = structuredClone(obj);
setProperty(copy, "a.b.c", value);
```

## dotenv

Status: reduce
Node 22+ supports `node --env-file=.env`. Keep only if programmatic loading is needed.

## @eslint/eslintrc, @eslint/js, eslint, eslint-config-standard, eslint-import-resolver-babel-module, eslint-plugin-import, eslint-plugin-lodash, eslint-plugin-promise, eslint-plugin-react

Status: ok

## eslint-plugin-node

Status: replace
Unmaintained. Use `eslint-plugin-n` (maintained fork, drop-in replacement).
https://github.com/eslint-community/eslint-plugin-n

## eslint-plugin-standard

Status: replace
Deprecated. Rules moved to eslint core. Remove entirely.

## exit-hook

Status: ok

## exifreader

Status: ok

## @faker-js/faker

Status: ok

## fast-glob

Status: ok

## fast-json-patch

Status: ok

## fast-json-stable-stringify

Status: replace
Use `JSON.stringify(obj, Object.keys(obj).sort())` for simple cases, or `safe-stable-stringify` (faster, maintained).
https://github.com/BridgeAR/safe-stable-stringify

## fecha

Status: replace
Use `date-fns` (already in deps) or `Intl.DateTimeFormat` (built-in).

```js
import { format } from "date-fns";
format(new Date(), "yyyy-MM-dd");
```

## find-up

Status: ok

## @floating-ui/dom

Status: ok

## folder-hash

Status: ok

## @fortawesome/fontawesome-common-types, @fortawesome/fontawesome-svg-core, @fortawesome/free-brands-svg-icons, @fortawesome/free-regular-svg-icons, @fortawesome/free-solid-svg-icons

Status: ok

## front-matter

Status: ok

## fuse.js

Status: ok

## get-tsconfig

Status: ok

## get-yarn-workspaces

Status: replace
Last published 2018. Use `find-workspaces` — supports yarn, npm, pnpm, lerna, and bolt. ESM + CJS, last updated Feb 2024.
https://github.com/joshuajaco/find-workspaces

```js
import { findWorkspaces } from "find-workspaces";
const workspaces = findWorkspaces();
```

## github-actions-wac

Status: ok

## graphql, graphql-request, graphql-scalars, graphql-tag

Status: ok

## @graphql-tools/merge, @graphql-tools/resolvers-composition, @graphql-tools/schema, @graphql-tools/utils

Status: ok

## history

Status: ok

## humanize-duration

Status: ok

## husky

Status: ok

## @iconify/json

Status: ok

## inquirer

Status: ok

## invariant

Status: replace
Inline assertion. No package needed.

```ts
function invariant(cond: unknown, msg: string): asserts cond {
  if (!cond) throw new Error(msg);
}
```

## jest-extended

Status: ok

## js-yaml

Status: ok

## jsdom

Status: ok

## jsesc

Status: ok

## jsonpack

Status: replace
Last published 2016. Use `JSON.stringify` + compression (built-in `CompressionStream`), or `msgpackr`.
https://github.com/kriszyp/msgpackr

## jwt-decode

Status: ok

## lerna

Status: ok

## lexical, @lexical/code, @lexical/hashtag, @lexical/headless, @lexical/history, @lexical/html, @lexical/list, @lexical/mark, @lexical/overflow, @lexical/rich-text, @lexical/selection, @lexical/text, @lexical/utils

Status: ok

## lint-staged

Status: ok

## listr2

Status: ok

## load-json-file

Status: replace
One-liner in Node 22+.

```js
JSON.parse(fs.readFileSync(path, "utf8"));
```

## load-script

Status: ok

## lodash

Status: reduce
Most utilities have native equivalents in ES2024+ (`structuredClone`, `Object.groupBy`, `Array.prototype.flat`, `Object.entries`). Keep only for deep path operations like `_.get`/`_.set` if needed.

## matcher

Status: ok

## @material-design-icons/svg

Status: ok

## mime

Status: ok

## minimatch

Status: ok

## mobx

Status: ok

## @modelcontextprotocol/sdk

Status: ok

## monaco-editor

Status: ok

## nanoid, nanoid-dictionary

Status: ok

## neverthrow

Status: ok

## @noble/hashes

Status: ok

## object-hash

Status: ok

## object-merge-advanced

Status: reduce
Consider using `deepmerge` (already in deps) to avoid two merge libraries.

## object-sizeof

Status: ok

## open

Status: ok

## ora

Status: ok

## os

Status: replace
Use `node:os` (built-in). This package just re-exports it.

## p-map, p-reduce, p-retry

Status: ok

## pluralize

Status: ok

## prettier

Status: ok

## raw.macro

Status: replace
Babel macro, deprecated pattern. Use `fs.readFileSync` at build time or raw loader.

## regenerator-runtime

Status: replace
Polyfill that enables `async/await` and generator functions (`function*`) by transpiling them into state machines. Babel injects it via `@babel/preset-env` or `@babel/plugin-transform-runtime` when targeting older environments. Used in React (browser) code. All modern browsers and Node 22+ support async/await and generators natively, so it can be removed if browser targets are modern. Check Babel `targets` config to confirm it's not being auto-injected.

## replace-in-path

Status: ok

## sanitize-filename

Status: ok

## semver

Status: ok

## serialize-error

Status: ok

## slugify

Status: ok

## srcset

Status: ok

## strip-ansi

Status: ok

## @swc/plugin-emotion

Status: ok

## tailwind-merge

Status: ok

## tinycolor2

Status: ok
Alternative: `colord` is smaller (3.4kB vs 12kB) if size matters.

## ts-expect

Status: ok

## ts-invariant

Status: replace
Same as `invariant`. Inline it.

## ts-morph

Status: ok

## tsx

Status: ok

## ttypescript

Status: replace
Unmaintained since 2022. Use `ts-patch` (maintained, same purpose).
https://github.com/nonara/ts-patch

## type-fest

Status: ok

## typescript, @typescript-eslint/eslint-plugin, @typescript-eslint/parser

Status: ok

## unicode-emoji-json

Status: ok

## uniqid

Status: replace
Use `crypto.randomUUID()` (built-in) or `nanoid` (already in deps).

## utf-8-validate

Status: ok

## uuid

Status: replace
Use `crypto.randomUUID()` (built-in, Node 22+ and all modern browsers).

```js
crypto.randomUUID(); // "a1b2c3d4-..."
```

## validate-npm-package-name

Status: ok

## validator

Status: ok

## vitest, @vitest/coverage-v8, @vitest/eslint-plugin

Status: ok

## warning

Status: replace
Use `console.warn` directly. No package needed.

## write-json-file

Status: replace
One-liner.

```js
fs.writeFileSync(path, JSON.stringify(data, null, "\t") + "\n");
```

## wts-client

Status: ok

## yargs

Status: ok

## yesno

Status: ok

## zod

Status: ok
