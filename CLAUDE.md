# Context

Read `AGENTS.md`.

# Claude Project Guidelines

This file is read by Claude Code on every run. Keep it up to date with your project's conventions.

## Project Overview

<!-- Describe what this project does in 2–3 sentences. -->

## Tech Stack

<!-- e.g. Node 20, TypeScript, React 18, PostgreSQL, tested with Vitest -->

## Development Commands

Always suppress verbose output to keep token usage low.
Redirect stdout to `/dev/null` for noisy commands and capture only stderr,
or use `tail` to capture just the last few lines when you need a summary.

```bash
# Install dependencies  (suppress all output – it's noise)
yarn > /dev/null 2>&1

# Run tests  (keep output – failures matter, but cap at last 50 lines)
yarn test packages/{package-name} 2>&1 | tail -50

# Build  (capture last 30 lines to see result without full log)
yarn build 2>&1 | tail -30
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

## Planning Guidelines (for `@claude plan`)

When creating a plan on an issue, Claude should:
1. Restate the goal in its own words to confirm understanding
2. Break work into clearly scoped steps (one concern per step)
3. Call out files to create or modify with the reason why
4. Flag any ambiguities as open questions

## Implementation Guidelines (for `@claude implement`)

- Read **all** issue comments before writing a single line of code
- Prefer editing existing files over creating new ones unless a new module is clearly needed
- Run `npm test` (or equivalent) before committing; fix any failures
- Keep PRs focused – one logical change per PR
- Do **not** modify unrelated files or bump dependency versions unless the issue asks for it

## PR Review Guidelines (for `@claude` on PRs)

- When asked for a review, comment inline on specific lines where relevant
- When asked to make a change, push a new commit to the existing branch (do not force-push)
- Always explain *why* a change is being made, not just *what*

## What Claude Should NOT Do

- Merge PRs
- Delete branches or tags
- Modify `.github/workflows/` files
- Change secrets or environment variable definitions
- Install new dependencies without explaining the rationale in the PR description
