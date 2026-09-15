## Exploration

- DO NOT read code in `dist` folders.

## Persist Learnings

When new backend features are discovered, update `ai-context/core-features-reference.md` with the new feature reference. DO NOT update this file with React features.

## Code

Code-style rules live in `ai-context/code-style/`, one rule per file (ESLint-style `do this / don't do this`). Read every rule in that folder before writing or editing code; see `ai-context/code-style/README.md` for the index. When adding a new rule, create a new `*.md` file there and add it to the index.

- When generating code, once done, run `git add .` to stage all changes.

## Building

- When type checking, use `yarn check -p <package-name>`, e.g., `yarn check -p @webiny/api-core`
- When building a single package, use `yarn build -p <package-name> --safe-replace`, e.g., `yarn build -p @webiny/api-core --safe-replace`. We use "--safe-replace" in order to not have our active bundling watch process break.
- To build all packages, simply run `yarn build`.
- To build all packages without caching, use `yarn build --no-cache `.
- `generate-webiny-package` emits unformatted output. Run `npx oxfmt packages/<new-package>` right
  after it, or the commit carries hundreds of lines of unrelated reflow.
- `yarn format` / `yarn lint` can silently no-op (`command not found: oxfmt`). Prefer `npx oxfmt` and
  `npx oxlint`, and check with repo-wide `yarn format:check` — oxfmt formats markdown too, so a
  packages-only run leaves `*.md` failing CI.

## Testing

- To test a package, use `yarn test packages/<package-name>`, e.g., `yarn test packages/api-core`
- Storage-backed suites need a storage flag or they **silently skip**. Without it the run reports
  something like `(920 tests | 920 skipped)` and still exits 0, which reads as a pass. Use
  `WEBINY_STORAGE=sql yarn test packages/<package-name>` (sqlite-backed).
- CI selects test jobs by **changed package**, so a PR touching only `api-aco` never runs the
  `api-headless-cms` suite. "CI will catch it" is false for cross-package behaviour changes —
  comment `/vitest` on the PR to run the full matrix.
- A unit test that registers its own subject can't prove the production wiring registers it. When
  adding a transport, route, or event handler, assert it from the composition root as well; two
  inbound transports have shipped unwired (WebSockets push, EventBridge Scheduler) with green
  per-transport tests.

## Commits

- Always run the full pre-commit checklist and commit after every code change — do not wait to be asked:
  ```bash
  git add .
  yarn > /dev/null 2>&1
  node scripts/generateTsConfigsInPackages.js
  yarn adio
  yarn format > /dev/null 2>&1
  yarn lint
  yarn webiny sync-dependencies
  git add .
  ```
  If any step fixes something, rerun from the top before committing.
- Avoid overly verbose descriptions or unnecessary details.
- Use conventional commit message formats like:
  - feat: for new features
  - fix: for bug fixes
  - docs: for documentation changes

## Entry Data Factory Pattern (`api-headless-cms`)

Entry data factories are injectable features, not imported functions. When writing use cases in `packages/api-headless-cms` that need to produce domain entry objects:

- **Do not** import from `~/crud/contentEntry/entryDataFactories/`
- **Do** inject the factory token via `createImplementation` dependencies and call `this.xyzFactory.create(...)`
- Factories live in `packages/api-headless-cms/src/features/contentEntry/entryDataFactories/`
- Token scope: `"Cms/Entry/<FactoryName>"` (e.g. `"Cms/Entry/CreateEntryDataFactory"`)
- All factories are singletons

Available factories:

- `CreateEntryDataFactory` — new entry from raw input
- `UpdateEntryDataFactory` — update existing entry
- `CreateEntryRevisionFromDataFactory` — new revision from existing entry
- `CreatePublishEntryDataFactory` — transition to published state
- `CreateUnpublishEntryDataFactory` — transition to unpublished state
- `CreateRepublishEntryDataFactory` — re-publish with refreshed references
- `CreateSimpleEntryDataFactory` — new simple entry from raw input
- `UpdateSimpleEntryDataFactory` — update existing simple entry

Factories reach entry validation and reference-field mapping through the injectable
`EntryDataProcessor` service (`features/contentEntry/entryDataProcessor/`) rather than importing
from `~/crud/`. `CreateEntryDataFactory` and both simple entry factories use it; the remaining four
still import directly.

Simple content entries are a reduced entry shape — always a single unpublished draft, opted into by
tagging a model with `SIMPLE_MODEL_TAG`. See
`packages/api-headless-cms/src/features/simpleContentEntries/DEVELOPERS.md`.

## Webiny

This project uses the Webiny framework.
A `webiny` MCP server is available.
When helping with Webiny-related tasks:

1. Call `list_webiny_skills` to see available skills.
2. Call `get_webiny_skill` with the relevant topic before writing code.

## CI/CD - GitHub Actions

When working on GitHub Actions workflows, when possible, we always want to make modifications on `.github/workflows/wac` TS files first, and then emit YAML files via `yarn ci-workflows:build`. Only work on YAML files if a corresponding .wac.ts file does not exist.
