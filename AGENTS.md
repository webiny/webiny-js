## Exploration

- DO NOT read code in `dist` folders.

## Persist Learnings

When new backend features are discovered, update `ai-context/core-features-reference.md` with the new feature reference. DO NOT update this file with React features.

## Code

- When writing comments, use `//` for single-line comments and `/* ... */` for multi-line comments. Always end comments with a period
- Use ES modules (import/export) syntax, not CommonJS (require)
- When generating code, once done, run `git add .` to stage all changes
- Only import one named import per line
- when generating code, one file MUST only contain one class
- When refactoring, we don't care about backwards compatibility, unless explicitly stated in the prompt

## Building

- When type checking, use `yarn check -p <package-name>`, e.g., `yarn check -p @webiny/api-core`
- When building a single package, use `yarn build -p <package-name> --safe-replace`, e.g., `yarn build -p @webiny/api-core --safe-replace`. We use "--safe-replace" in order to not have our active bundling watch process break.
- To build all packages, simply run `yarn build`.
- To build all packages without caching, use `yarn build --no-cache `.

## Testing

- To test a package, use `yarn test packages/<package-name>`, e.g., `yarn test packages/api-core`

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

## Webiny

This project uses the Webiny framework.
A `webiny` MCP server is available.
When helping with Webiny-related tasks:

1. Call `list_webiny_skills` to see available skills.
2. Call `get_webiny_skill` with the relevant topic before writing code.

## CI/CD - GitHub Actions
When working on GitHub Actions workflows, when possible, we always want to make modifications on `.github/workflows/wac` TS files first, and then emit YAML files via `yarn ci-workflows:build`. Only work on YAML files if a corresponding .wac.ts file does not exist.