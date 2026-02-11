## Plan Mode

1. Make the plan extremely concise. Sacrifice grammar for the sake of concision.
2. At the end of each plan, give me a list of unresolved questions to answer, if any.

## Context

Read these documentation files when implementing API features (paths: `packages/api**` or `packages/*/src/api/**`):

- ai-context/backend/di-container.md
- ai-context/backend/event-publisher.md
- ai-context/backend/backend-developer-guide.md
- ai-context/backend/core-features-reference.md

## Persist Learnings

When new features are discovered, update `ai-context/backend/core-features-reference.md` with the new feature reference. DO NOT update this file with React features.

## Code

1. When writing comments, use `//` for single-line comments and `/* ... */` for multi-line comments. Always end comments with a period
2. Use ES modules (import/export) syntax, not CommonJS (require)
3. When generating code, once done, run `git add .` to stage all changes
4. Only import one named import per line
5. You MUST USE `import { createAbstraction } from "@webiny/feature/api";` instead of `new Abstraction()`
6. Always register use cases in transient scope: `container.register(CreateTenantUseCase);`
7. Always register repositories in singleton scope: `container.register(CreateTenantRepository).inSingletonScope();`
8. Always register gateways in singleton scope: `container.register(CreateTenantGateway).inSingletonScope();`
9. when generating code, one file MUST only contain one class
10. When refactoring, we don't care about backwards compatibility, unless explicitly stated in the prompt

## Building

1. When building a single package, use `yarn build -p <package-name>`, e.g., `yarn build -p @webiny/api-core`.
2. To build all packages, simply run `yarn build`.
3. To build all packages without caching, use `yarn build --no-cache`.

## Testing

1. To test a package, use `yarn test packages/<package-name>`, e.g., `yarn test packages/api-core`

## Commits

1. Do not commit by yourself when on local machine. I'll do it.
2. Avoid overly verbose descriptions or unnecessary details.
3. Use conventional commit message formats like:
   - feat: for new features
   - fix: for bug fixes
   - docs: for documentation changes
