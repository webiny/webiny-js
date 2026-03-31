# Context

Read `AGENTS.md`.

# Claude Project Guidelines

This file is read by Claude Code on every run. Keep it up to date with your project's conventions.

## Development Commands

Always suppress verbose output to keep token usage low.
Redirect stdout to `/dev/null` for noisy commands and capture only stderr,
or use `tail` to capture just the last few lines when you need a summary.

```bash
# Install dependencies  (suppress all output – it's noise)
yarn > /dev/null 2>&1

# Run tests  (keep output – failures matter, but cap at last 50 lines)
yarn test packages/{package-name} 2>&1 | tail -50

# Build all changed packages  (capture last 30 lines to see result without full log)
yarn build 2>&1 | tail -30

# Build a single package  (capture last 30 lines to see result without full log)
yarn build -p @webiny/api-core 2>&1 | tail -30
```

## Before Commit

Before each commit, run the following commands:

```
# Stage all changed files
git add .

# Ensure yarn.lock is up to date
yarn > /dev/null 2>&1

# Update all tsconfig files
node scripts/generateTsConfigsInPackages.js

# Make sure all package.json deps are configured correctly
yarn adio

# Prettier format changed files
npx pretty-quick > /dev/null 2>&1

# Run eslint
y eslint

# Make sure dependencies are in sync
yarn webiny sync-dependencies

# Stage all changed files (again!)
git add .
```

If any of the steps fail, and you fix anything, you must rerun all scripts from the beginning.

## Code Conventions

- **Formatting:** Prettier with project defaults (`.prettierrc`)
- **Linting:** ESLint with project config (`.eslintrc`)
- **Commit style:** Conventional Commits (`feat:`, `fix:`, `chore:`, etc.)
- **Branch naming:** `claude/issue-<number>` for Claude-generated branches
- **PR titles:** Mirror the commit style

## Webiny

This project uses the Webiny framework.
A `webiny` MCP server is available.
When helping with Webiny-related tasks:

1. Call `list_webiny_skills` to see available skills.
2. Call `get_webiny_skill` with the relevant topic before writing code.
