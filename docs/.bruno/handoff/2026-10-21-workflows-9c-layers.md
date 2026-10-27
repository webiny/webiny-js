# Session Handoff — 2026-10-21 — Workflows 9c, merge of next, admin layering refactor

## What was done

- 76 own commits on `bruno/refactor/workflows-flow` since `66a2d8797c` (195 including the merge of `origin/next`), all local.
- **Phase 9c, settings and permissions** (plan `docs/.bruno/plans/2026-10-19-workflows-phase-9c/`, answers Q60-Q68, D178-D182): the "Reviewer exclusions" page under Settings → Workflows, the Workflows group in the security role form (No access / Full / Custom with "Manage workflows" and "Reassign and operate"), a no-access view on the settings and editor routes, the admin-ui `DateOnlyPicker` fix, removal of dead permission code, docs. Final fix wave: Santiago DST end-of-day, dialog fields frozen while saving, role form reads server-matched wildcard permissions via `minimatch`.
- **9b leftover bugs**: rule errors on unreadable rules, nested call args, a test title, the muted deleted-user icon in the closed picker.
- **Sweeps**: app-admin tool test types, persistence errors send fixed client messages and log the raw cause under pino's `err` key (also every caught exception), SEC ids removed from code, APW leftovers removed, workflows docs (api.md 1-10, README, integrations, infrastructure) rewritten to match code, B2 marked fixed.
- **Merge of `origin/next`** (`e218019414`, 118 commits) plus follow-ups: WB page rules moved onto Website Builder page events (next turned off CMS events for the page model), graduated A/B variant revisions get their review state cleared, shared update/folder guards in api-workflows, ai-powerups raw cause, per-revision publish flags in the CMS revisions list with Publish hidden (Unpublish kept) on workflow models.
- **Bugs found while testing**: CMS model group looked up by id instead of slug (`3269aafe99`, caused "not authorized" on code-defined models), Content Reviews model list loaded before sign-in (`f5b93b2d1c`), Content Reviews page stuck on the loader because the router keeps the first route element (`d842e0311c`), long labels overflowing the step drawer, Add step dialog bottom spacing, review steps popover width.
- **Naming**: no `*Impl` files left in workflows packages; tests alias the abstraction, not the implementation.
- **Admin layering refactor** (plan `docs/.bruno/plans/2026-10-19-workflows-admin-layers/`, answers Q69-Q76, D183-D187): the multi-method "UseCases" bundles became presenter → one `XUseCase` per operation → area repository (mapping + workflow-list cache) → area gateway (GraphQL + one error helper). App-neutral use cases; a routing gateway picks the CMS or WB app gateway by namespace or app through `@webiny/di` multi-injection. 16 commits `3763c4f2d6`..`664180b614`.
- Tests at the end: app-workflows 3175, app-headless-cms-workflows 334, app-website-builder-workflows 340; API suites (run before the layering refactor, after the merge where noted): api-workflows 1651 (test + test:os), api-headless-cms-workflows 496 (test), api-website-builder-workflows 403 (test + test:os), ai-powerups 362.

## Key decisions

- Never merge the branch, never list merge as a step; never run the handoff on my own (memory).
- Tests never run in parallel, across all agents.
- Naming: no `Impl`/`Implementation`/`Abstr`/`Abstraction` suffix on exported names or files; when an alias is needed, alias the abstraction as `XAbstraction`.
- Admin data layer follows presenter → use case → repository → gateway; per-app variation lives only in the app gateways behind a routing gateway.
- A CMS model's `group` is the group slug, not its id.
- Code-defined config routes keep the first element: route pages must read live state, never captured props.
- For refactors use the lean process: few agents, one review at the end (user asked to cut token use).

## Current state

- Branch: `bruno/refactor/workflows-flow` (not main), all commits local, never pushed by Claude.
- Lint clean; `format:check` clean.
- Admin workflows suites green at `d842e0311c`; later commits touched only `ReviewStepsPopover.tsx` (ReviewBar tests 19/19).
- Full repo build/test not run at handoff (per-package suites run instead).

## What might come next

- Browser checks with `.superpowers/sdd/browser-checklist.md`, plus: Content Reviews page loads, steps popover width, drawer label wrapping, Add step dialog, request review on a code-defined model.
- Re-run `yarn test:os` for api-headless-cms-workflows (stopped after the merge; `yarn test` passed).
- Pre-merge housekeeping: 17 older commits with a wrong co-author line (history rewrite is the user's call).
- Outside workflows, noted only: base `IdentityContext.getPermission` matches odd stored names such as `!foo`; admin-ui date range / multiple dates pickers show the day before west of UTC; admin-ui dialog close button lacks a "Close" name.
