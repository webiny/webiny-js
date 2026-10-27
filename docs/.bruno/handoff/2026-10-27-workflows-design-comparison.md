# Session Handoff — 2026-10-27 — Workflows design vs live comparison and fixes

## What was done

- **Umbrella #6079 assembled.** All 44 part PRs (#6037–#6078, #6083, #6086) were squash-merged into `bruno/feat/workflows-umbrella` through GitHub at the user's request; the CI runs they triggered were cancelled (four CodeQL/PR runs needed a force-cancel). The stale 09b96a14 stack worktree was removed.
- **Live test data on `dev`** (local admin at http://localhost:3001 against the deployed API): Website Builder workflow "Page review" and CMS "Product review" (three people steps each), 10 seeded pages and 11 Product entries in every review state, plus the second-pass items prefixed P2-WB, P2-CMS, P2-LIST, P2-AI, P2-ED. pavel@webiny.com was added to Content Team; role "Content reader" and user rita@webiny.com (password `Reader12345`) were created; model "Zz Delete Test" (`zzDeleteTest2`, group `ungrouped`) with workflow `wfZzDeleteTest03` (AI tone check + two pick steps) is a test fixture.
- **Design comparison.** All 179 design States frames plus Notifications, Model Delete and Picker were compared with the live admin in two passes (read-only first, then with data changes allowed). Findings, review verdicts and both passes are in `docs/.bruno/workflows/2026-10-27-design-vs-live.md`.
- **First fix plan** (`docs/.bruno/plans/2026-10-27-workflows-design-gaps-fix.md`, 9 tasks, all done and reviewed): no Request review on a revision published before its workflow; canceller named in the conflict; "Team pool" owner in Content Reviews; Failed tag `sync_problem` icon (R263); widget app labels; AI issue field labels; ghost more buttons, red Reject/Cancel review confirms, modal Review details drawer; hints below fields; model delete blocked by a workflow (base `app-headless-cms`: typed error + decoratable `FullyDeleteModelError`, approved) with the design dialog and orange "Open workflow →" link. Follow-ups: drawer stays open on toast clicks, AI field labels from own keys only, widget title no longer clipped, Content Reviews menu item without icon.
- **Part 2 plan** (`docs/.bruno/plans/2026-10-27-workflows-design-gaps-fix-part-2.md`, 31 tasks) run subagent-driven: Tasks 1–11 complete and reviewed, Task 12 implemented (not reviewed). Highlights: skipped-by-assignment records the requester and excluded people (api-workflows); shared picker icon and clear rules; review titles without the model prefix; action dialog copy, validation and list/editor context; conflict state keeps title, body, comment and notify; step candidates carry team names (api + app); reviewer picker avatars, team line, in-list error, nobody box; request dialog layout; bar failed/no-access states; Website Builder bar as a full-width strip; Review details view model and drawer (content link, Today, attempt parts, timeline, cancelled state).
- 40 commits on `bruno/feat/workflows-umbrella` this session after the squash merges (pushed by the user).

## Key decisions

- **Design system first.** Pure styling the design system and admin-ui do not have (bordered/iconed tags, custom alert borders/colours, coloured strips, custom notice styles) is recorded as "design deviates from the design system", not fixed. Where admin-ui lags its own design system kit (table card, Tabs, Dialog dividers, button heights, Switch colour, radio cards), it is listed for the admin-ui owner. Workflows code never changes admin-ui; it uses existing variants and props.
- **Merging.** Claude merges workflows branches only on the user's explicit request (this session: parts into #6079 via GitHub squash); never #5973 or #6079 into `next`, never suggests merging. Memory updated.
- **Never deploy.** Claude never runs or offers a deploy; the user deploys. Memory added.
- **Commit trailer** is `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>` regardless of the subagent's model (one Haiku commit, c29d743d76, kept its own trailer; no amend).
- Rulings per task (skips stay rule + strategy for a rule-targeted requester/excluded user, request dialog has no visible Reviewer label, nobody detail line copy, WB strip also for failed/loading, etc.) are in the part 2 ledger and summarised in the final message of that run.

## Current state

- Branch: `bruno/feat/workflows-umbrella`, in sync with origin (the user pushed).
- Checks at handoff: `yarn lint` clean, `yarn format:check` clean, builds of the 7 changed packages pass. Tests: api-workflows 1711, api-headless-cms-workflows 506, api-website-builder-workflows 406, app-workflows 3138, app-headless-cms-workflows 340, app-website-builder-workflows 326 (all passing); app-headless-cms only the changed model-delete folders (4). The repo has no `lint:check` script; the handoff skill names one.
- Part 2 ledger (git-ignored): `.superpowers/sdd/2026-10-27-workflows-design-gaps-fix-part-2/progress.md` — Tasks 1–11 complete, Task 12 implemented and not reviewed, Tasks 13–31 not started; the run is paused by the user.
- No background shells or browser sessions left running.

## What might come next

- Resume part 2: review Task 12, then Tasks 13–31 (Content Reviews rows/menu/filter, widgets as Widget cards, EmptyState illustrations, editor title/flow/step type picker/confirm dialogs/AI form/people sections/test routing, then the L tasks), then the final whole-branch review.
- Decide the "Needs approval / out of bounds" list in the part 2 plan (full-width widget row, FormView highlight and banner slot, popover on hover, toast focus pause, hiding the CMS form for no-access, developer-mode remove review request, own-second-session copy, WB second read-only strip).
- Deferred minors: in the part 2 ledger (e.g. inspector may list a person twice, unused `model` parameter in `getCmsEntryReviewContext`, ReassignDialog Close style) and the first plan's (blank canceller wording in the drawer, Notify via hint position while loading).
- Clean up `dev` when testing is done: seeded and P2-* content, the two test workflows on Product and Pages, `zzDeleteTest2` and its workflow, role "Content reader" and user rita, pavel's Content Team membership.
- Base CMS observation: `createContentModel` accepts a group id where the slug is expected; such a model can never take a review (workflows group lookup is slug-only).
