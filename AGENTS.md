## Exploration

- DO NOT read code in `dist` folders.

## Persist Learnings

When new backend features are discovered, update `ai-context/core-features-reference.md` with the new feature reference. DO NOT update this file with React features.

## Code

Code-style rules live in `ai-context/code-style/`, one rule per file (ESLint-style `do this / don't do this`). Read every rule in that folder before writing or editing code; see `ai-context/code-style/README.md` for the index. When adding a new rule, create a new `*.md` file there and add it to the index.

- When generating code, once done, run `git add .` to stage all changes.

## Cross-cutting formatting/utility features

Cross-cutting formatting or string-utility logic (date formatting, slugifying, and similar helpers that would otherwise be imported ad-hoc in many places) MUST be an injectable, decoratable DI feature — never a bare imported util. This lets projects override the behavior globally by decorating the abstraction, instead of intercepting it at the bundler level.

- Home such features in `@webiny/app-admin` (`src/features/<name>/`) so any admin module can use them. Register the default implementation with the core features in `src/base/Admin.tsx` so it is always available.
- Structure: `createAbstraction` (abstraction) + `createImplementation` (default impl, holding the canonical options) + `createFeature` (registers the impl) + a `use<Name>` hook. Mirror `features/stringFormatter` / `features/dateFormatter`.
- Group related transforms behind one broad, consumer-facing feature (e.g. `StringFormatter`, whose methods will grow over time), but keep each transform's logic in its own small, single-method decoratable feature that the broad one delegates to. Example: `StringFormatter.slugify()` calls `Slugify.execute()` internally, so a project changes slug logic by decorating `Slugify` alone — a smaller surface than decorating the whole formatter.
- Consumers depend on the broad feature (`StringFormatter`, `DateFormatter`); the fine-grained transform feature (`Slugify`) is an internal dependency of the broad one and the decorate seam. Do the formatting in a presenter (expose the formatted string on the view model). Only presenter-less components resolve the feature through the `use<Name>` hook.
- Inject the abstraction into a presenter via its `dependencies` array; do not import the bare util.
- Exceptions — keep using a plain util when the value must stay stable regardless of project overrides (e.g. internally-generated keys), or when the consumer is a lower-level package that cannot depend on `@webiny/app-admin`.

To override a feature's behavior for a project, decorate the abstraction — written across multiple lines, not inlined:

```ts
const MyDateFormat = DateFormatter.createDecorator(() => {
  return {
    format: date => {
      const formatter = new Intl.DateTimeFormat("en-GB", { dateStyle: "medium" });
      return formatter.format(new Date(date));
    }
  };
});

container.registerDecorator(MyDateFormat);
```

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
