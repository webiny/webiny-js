# AI Workflow Steps — Agent Handoff

## Your Mission

Implement the plan at `docs/superpowers/plans/2026-05-29-ai-workflow-steps.md` from start to finish. No tasks have been started. The plan has 9 sequential tasks, each ending with a commit.

## Setup

1. **Branch:** `bruno/feat/api-workflows/ai-workflow`
2. **Package:** `packages/api-workflows`
3. Read these files before writing any code:
   - `AGENTS.md` — code conventions, commit checklist, build commands
   - `CLAUDE.md` — project guidelines, pre-commit steps
   - `docs/superpowers/plans/2026-05-29-ai-workflow-steps.md` — the full plan with code for every file

## What the Plan Does

Extends `packages/api-workflows` so workflow steps can be either human-reviewed or AI-evaluated. AI steps auto-start via background tasks, run an LLM prompt, and approve/reject based on the verdict.

## Execution Rules

- Follow the plan step by step — it has full code for every file.
- After each task, run the pre-commit checklist from AGENTS.md and commit with the message specified in the plan.
- If a type check fails, fix it before moving on.
- Do NOT skip verification steps (`yarn check`, `yarn build`).

## Watch Items (from 2 rounds of code review)

1. **Task 1 is the largest** — domain types + AiIdentity class + enrichStep update, all in one commit to prevent a crash window where `teams` is optional but the null-guard hasn't been added yet.
2. **Task 4 Step 2:** Try removing the `.transform()` cast first; keep it only if type check fails.
3. **Task 6 Step 1:** Add the missing barrel export to `ApproveWorkflowStateStep/index.ts` BEFORE creating the event handlers — they import from it.
4. **Import paths for `TaskService`, `Logger`, `Ai`, `AuthenticatedIdentity`** — the plan notes grep commands to run if paths are wrong.
5. **Task 9 Step 3:** If tests fail because existing step fixtures lack the new `type` field, add `type: "human"` to the fixtures.

## Review Resolutions Table

The plan has a "Review Resolutions" table at the top with 10 resolved issues. Read it — it explains design decisions you'll encounter (e.g., why `setIdentity()` is correct, why `startStep.execute()` doesn't take a `stepId`).

## Pre-Commit Checklist (run after every task)

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

If any step fixes something, rerun from the top.

## After All 9 Tasks

Run the full verification from Task 9:
```bash
yarn check -p @webiny/api-workflows 2>&1 | tail -50
yarn build -p @webiny/api-workflows 2>&1 | tail -30
yarn test packages/api-workflows 2>&1 | tail -50
```

Then commit any remaining fixes and report completion.
