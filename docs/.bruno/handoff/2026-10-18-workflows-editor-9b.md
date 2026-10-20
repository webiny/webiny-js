# Session Handoff — 2026-10-18 — Workflows phases 8b, 9a and 9b

## What was done

- 122 commits on `bruno/refactor/workflows-flow` (from `38b237064e`), 1061 files, all in the workflows packages plus `app-admin` (JSON-schema FormModel adapter), `admin-ui` (destructive `Button` variant, `RadioGroup`/`CheckboxGroup`/`Checkbox` items held by reference) and docs.
- Pre-merge fixes from the 8a handoff (`useGraphQLHandler` token type, MailerService docs).
- **Phase 8b, automation, AI and live updates** (plan `docs/.bruno/plans/2026-10-17-workflows-phase-8b/`): running/failed states, restart, Failed steps tab, attempts and AI issues in the details drawer, silent `workflows.reviewChanged` refetch, editor reload on content change, CMS bulk-trash pre-check.
- **Phase 9a, editor foundation** (plan `docs/.bruno/plans/2026-10-18-workflows-phase-9a/`): the new workflow editor at `/cms/workflows` and `/website-builder/workflows`, step drawer on FormModel with the People, Automation and full AI step forms, explicit save with the conflict/deleted/duplicate/blocked-delete dialogs, leave guard, shared searchable Picker, `workflows.listTeams`, `changesContent` on AI tools, the old editor deleted.
- **Phase 9b, assignment editor** (plan `docs/.bruno/plans/2026-10-18-workflows-phase-9b/`): the People step's Assignment and Test routing tabs (strategy cards, the requester-pick toggle, routing rules with user/team/folder pickers), saved-reference resolution ("Deleted user", "Deleted team", "Restricted folder", "Deleted folder"), live rule errors that block Save, server rule errors mapped to the rule and tab, Test routing on the unsaved step with a row per rule; API: `listUsers` team scope and team ids, `ruleId` on rule errors, `inspectRouting` explains every rule, teams-off handling; the admin-ui group fix that closed the 9a pre-merge gap.
- Every task was implemented and reviewed by subagents, followed by a split final review, one fix wave and a re-review per phase. Ledgers: `.superpowers/sdd/p8b-plan/`, `p9a-plan/`, `p9b-plan/` (`exec-ledger.md`, gitignored).
- Tests run at handoff: app-workflows 2567, app-headless-cms-workflows 317, app-website-builder-workflows 328 (all pass). API suites ran per task (`yarn test` and `yarn test:os` by path), not as a full run here.

## Key decisions

- Extend workflows-owned operations, never base Webiny, unless necessary; base must work without workflows. Base Webiny has teams off by default (`advancedAccessControlLayer.teams`): with teams off nothing queries or returns team data, the People step is unavailable and saved People steps are read-only (Q49, Q58; memory `feedback_extend_workflows_not_base`).
- In API tests the teams flag is ON by default (the test handler loads a full test licence); teams-off tests set it explicitly.
- 9b answers Q49-Q59 (`docs/.bruno/plans/2026-10-18-workflows-phase-9b/00-answers.md`), decisions D170-D177, rulings R285-R315.
- Execution rulings (ledgers): edits are ignored while a save runs and the drawer is read-only during a save; saved rule data the editor cannot read round-trips unchanged; rules live in the form (FormModel `permissions` field type, spike passed); a new rule targets the first reviewing team's pool; picker load failures use the drawer banner "Could not load the step options."; tab error marks use FormModel's asterisk; rules after the deciding one show "Skipped – An earlier rule matched.".
- One named import per line stays the rule (a fix-wave merge was reverted in `49b1301a16`).
- Dispatch prompts to implementers must spell out the exact commit trailer (Opus 5.5 + session URL).

## Current state

- Branch: `bruno/refactor/workflows-flow` (not `main`; merges only after all phases)
- Tests: admin workflow packages 3212 passed; API suites green per task
- Build: passing for every touched package (admin-ui, app-admin, app-workflows, app-headless-cms-workflows, app-website-builder-workflows, api-workflows, api-headless-cms-workflows, api-website-builder-workflows, ai-powerups)
- Lint clean; `format:check` flags only `.gitleaks.toml`, which is never committed
- Unpushed commits: all (never pushed)

## What might come next

- Phase 9c: exclusion settings page, workflows permission UI, granting `reassign` in the role form.
- Pre-merge list:
  - Wrong commit trailers (Sonnet): `65f25d7843` (8b), `0961c6412c` (9b Task 5); older trailers on `4602a65331` and earlier.
  - SEC ids still in code/tests in 26 files from earlier phases (sweep).
  - `WorkflowPersistenceError` raw message leak (security register candidate).
  - 8 pre-existing app-admin `check:test:types` errors in `__tests__/features/tools`.
  - 9b minors: server `rules.<index>` mis-targets when unreadable rules exist; nested call args in `StepDrawerPresenter` and `assignmentToConfig`; a misleading test title; a saved "Deleted user" in the closed single picker shows as plain text.
- Browser checks: the 9a editor end to end in CMS and WB; 9b Assignment and Test routing tabs in both apps, the folder picker per app, keyboard rule moves and the announcement, the drawer read-only during a save; the 8b items (WB reload, loading flash, autosave, owner-less AI step tag).
- After 9c: the final sweep that removes anything left of the old domain, GraphQL and admin, then merge.
