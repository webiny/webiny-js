## Plan Mode

- Make the plan extremely concise. Sacrifice grammar for the sake of concision.
- At the end of each plan, give me a list of unresolved questions to answer, if any.
- DO NOT read code in `dist` folders.

## Persist Learnings

When new backend features are discovered, update `ai-context/core-features-reference.md` with the new feature reference. DO NOT update this file with React features.

## Code

- When writing comments, use `//` for single-line comments and `/* ... */` for multi-line comments. Always end comments with a period
- Use ES modules (import/export) syntax, not CommonJS (require)
- When generating code, once done, run `git add .` to stage all changes
- Only import one named import per line
- You MUST USE `import { createAbstraction } from "@webiny/feature/api";` instead of `new Abstraction()`
- when generating code, one file MUST only contain one class
- When refactoring, we don't care about backwards compatibility, unless explicitly stated in the prompt

## Building

- When building a single package, use `yarn build -p <package-name>`, e.g., `yarn build -p @webiny/api-core`.
- To build all packages, simply run `yarn build`.
- To build all packages without caching, use `yarn build --no-cache`.

## Testing

- To test a package, use `yarn test packages/<package-name>`, e.g., `yarn test packages/api-core`

## Commits

- Do not commit by yourself when on local machine. I'll do it.
- Avoid overly verbose descriptions or unnecessary details.
- Use conventional commit message formats like:
  - feat: for new features
  - fix: for bug fixes
  - docs: for documentation changes

## Webiny

This project uses the Webiny framework.
A `webiny` MCP server is available.
When helping with Webiny-related tasks:
1. Call `list_webiny_skills` to see available skills.
2. Call `get_webiny_skill` with the relevant topic before writing code.
