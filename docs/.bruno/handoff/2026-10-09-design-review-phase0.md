# Session Handoff — 2026-10-09 — Design review, design skills, phase 0 start

## What was done

- **Claude Design connected.** The `claude-design` MCP server (`https://api.anthropic.com/v1/design/mcp`, OAuth) is added in the local Claude Code config of this project. `MAX_MCP_OUTPUT_TOKENS=2000` is set in `.claude/settings.local.json` (local), so MCP results over about 8 KB are saved to files that the helper reads directly.
- **Two project skills, committed:**
  - `/design-pull` mirrors a Claude Design project into a git-ignored folder and keeps an etag catalogue of what was pulled and implemented (`mark` / `unmark`).
  - `/design-ask` logs prefixed questions (`QBZ-n`) and copies a paste-ready prompt for Claude Design; answers come back through `answers.md` on the next pull.
  - Helper: `.claude/skills/design-pull/lib.ts` + `design.ts` (TypeScript via `yarn tsx`, Node built-ins only), 86 tests (`yarn tsx --test '.claude/skills/design-pull/tests/*.test.ts'`).
  - Spec `docs/.bruno/specs/2026-10-07-design-pull-ask-skills-design.md`, plan `docs/.bruno/plans/2026-10-07-design-pull-ask-skills.md`.
  - The first Python version was dropped and removed from history before push.
- **Workflows UI design review.**
  - Local design copy: `docs/.bruno/workflows/design/` (git-ignored through `.git/info/exclude`): `files/`, `catalogue.md`, `questions.md`, `answers.md`, `gaps.md`. Question prefix `BZ`.
  - Five parallel subagent reviews of 12 screens against the UI brief, plus a final verification round.
  - 98 questions asked; QBZ-1..97 answered and pulled; screens updated by the designer.
- **Decisions D102–D131** recorded in `docs/.bruno/workflows/decisions.md`. The UI brief, the main spec (`docs/.bruno/specs/2026-10-05-workflows-refactor-design.md`, now "D1-D131") and the roadmap (`docs/.bruno/plans/2026-10-05-workflows-refactor-roadmap.md`) are updated. A subagent review of spec and roadmap was applied (D127–D131).
- **Phase 0 execution started** (subagent-driven). Task 1, "register the workflows feature once" (B2, API), is implemented in commit `deff58b4a0`; its task review is not run yet.
- 49 commits this session (from `5c38f78801`).

## Key decisions

- **Notifications.**
  - In-app notifications are toasts in one admin `Notifications` stack, with no list or inbox (D102, D125).
  - Review-level e-mails use the deciding step's channels (D103).
  - Take over can notify the previous owner (D111).
- **Naming.** Automated steps are named by step title (D107, D126). Lists say "Content type" (D113).
- **Lists.** A Failed steps tab for `reassign` (D112). Sorting only by `lastChangedOn` (D119). No workload counts anywhere (D104).
- **Exclusions.** One entry per user (D105), last save wins (D106), end dates across timezones (D110, D124).
- **Workflows.** At least one step (D108). AI instructions required (D109). Optimistic save check with `Workflows/Workflow/Conflict` and `NotFound` (D131).
- **APIs and UI.**
  - Start asks for confirmation (D114).
  - Unpublished approved revisions can be republished (D121).
  - Unavailable step types are shown disabled (D122).
  - New APIs: assignment details (D127), reassign candidates (D128), `listNotificationTransports` (D129), the editor model list and step-type availability (D130).
- **Rules for agents.**
  - Design data never goes to GitHub: the design folder, catalogue, questions and answers are local only. The skills are committed.
  - The skills never write to Claude Design; questions go through the clipboard.
  - Phase 0 commits end with only `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`, not the plan's `Claude-Session` line (ledger ruling).

## Current state

- Branch: `bruno/refactor/workflows-flow`, not pushed (the dropped Python commits were never pushed, so a normal push works).
- Lint and format pass; skill tests 86/86. Full monorepo `yarn build && yarn test` was not run in this handoff. The Task 1 implementer ran the package builds and tests: api-headless-cms-workflows 6/6, api-workflows 54/54.
- `yarn test:os` for the Task 1 packages could not run locally (no OpenSearch or docker).
- **Phase 0 ledger:** `.superpowers/sdd/2026-10-05-workflows-phase-0-prerequisites/progress.md` (git-ignored). It holds the pre-flight table, rulings and the Task 1 state. Task 1 report: `task-1-report.md` in the same folder.
- Open designer question **QBZ-98** (drop "by {step}" when a step rejects itself, D126) is logged; its paste text is in `<scratchpad>/ask-paste-5.txt` (session scratchpad, may be gone). Re-create it with `/design-ask --resend`.

## What might come next

1. **Resume phase 0** with superpowers:subagent-driven-development on `docs/.bruno/plans/2026-10-05-workflows-phase-0-prerequisites.md`:
   - Run the Task 1 task review: review package from BASE `dda95d64dd` to `deff58b4a0`.
   - Adjudicate the implementer's deviation: the CMS registration test uses `resolveAll(CreateWorkflowUseCase)` instead of `NotificationTransport`, because MailerService is missing in the harness.
   - Then Tasks 2–8, the final review, and finishing the branch.
2. **Paste QBZ-98** into Claude Design, then `/design-pull docs/.bruno/workflows/design`.
3. **Run `yarn test:os`** for api-workflows and api-headless-cms-workflows where OpenSearch is available.
4. **After phase 0,** write the phase 1a plan from the roadmap.
