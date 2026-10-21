### Task 38: Spec, roadmap, decisions D157-D159, `app.md` and the handoff

R233 (docs numbering), D157, D158, D159 (`../00-shared.md` "Decisions"), Review Focus 15 and the sub-phase rule "SEC ids stay out of `decisions.md`, the spec and guides"; spec 13.1, 13.3-13.5 as built; roadmap row 8a built with the 8b hand-off. A docs task: no TDD cycle, no code. The proofs are greps before and after, a claim-by-claim check of every statement against the as-built code, and the pre-commit chain. **Every claim below is a claim about code Tasks 1-37 built: Step 2 checks each against the tree before the text is written, and a claim the code contradicts is corrected in the doc, never kept.**

- **Decisions:** append D157 (trash and delete warning driven by the server refusal), D158 (review steps carry `candidateTeams`), D159 (shared core in `app-workflows`, app-owned documents and glue) to `docs/.bruno/workflows/decisions.md` (last entry today is D156), one pointer line added to D134 (order superseded by D157) and the D60 client sentence corrected (`WorkflowStateChangedEvent` is gone, R210, R213).
- **Spec** (`docs/.bruno/specs/2026-10-05-workflows-refactor-design.md`): status line and decision range; 4.2 step shape (`candidateTeams`); 5.1 trash/delete bullet (order of the dialogs, revision-scoped cancel); new 9.6 (Website Builder `deletePageRevision`); 10 (`cancelWebsiteBuilderPageReviewsForDelete(pageId, revisionId, action)`, the `candidateTeams` bullet); 12 (client websocket handling); 13.1, 13.3, 13.4, 13.5 as built and a new 13.8 (trash and delete warning).
- **Roadmap** (`docs/.bruno/plans/2026-10-05-workflows-refactor-roadmap.md`): header range D1-D159, row 7 client work left, row 8a built, row 8b hand-off (from the plan's "Not in this phase", including the R228 limitation).
- **Guides** (`docs/.bruno/workflows/`): `app.md` refreshed (as built: sections 1, 2, 4, 5, 6, 8, 9 rewritten; the editor section 3 and the open editor bugs of section 7 kept), `integrations.md` (admin package bullets and section 5 as built), `README.md` (index lines), `bugs.md` B2 only if its admin bullet is resolved.
- **Local, not committed:** the design catalogue (`docs/.bruno/workflows/design/catalogue.md`, in `.git/info/exclude`) marked with `/design-pull mark`; the session handoff is committed (`docs/.bruno/handoff/`).
- **No SEC id** anywhere in the committed files (decisions, spec, guides, handoff). Plan files may keep them.

**Files:**
- Modify: `docs/.bruno/workflows/decisions.md`
- Modify: `docs/.bruno/specs/2026-10-05-workflows-refactor-design.md`
- Modify: `docs/.bruno/plans/2026-10-05-workflows-refactor-roadmap.md`
- Modify: `docs/.bruno/workflows/app.md`, `docs/.bruno/workflows/integrations.md`, `docs/.bruno/workflows/README.md`, and `docs/.bruno/workflows/bugs.md` (conditional)
- Create: `docs/.bruno/handoff/<YYYY-MM-DD>-workflows-phase-8a.md` (`<YYYY-MM-DD>` = `date +%F` on the day the task runs)
- Local only (never staged): `docs/.bruno/workflows/design/catalogue.md` and its `.implemented/` copies

**Interfaces:**
- Consumes: the whole phase (Tasks 1-37 as committed) and the `## Decisions` and `## Rulings` of `../00-shared.md` (D157-D159, R202-R236, A68-A88, Q1-Q15 of `../00-answers.md`); existing docs as quoted in the steps below.
- Produces: the recorded decisions D157-D159 and the as-built documentation, no code. Acceptance: a grep for `WorkflowStateChangedEvent`, `workflows.own` and `overlay` (case-insensitive) in `docs/.bruno/workflows` (the gitignored `design/` folder excluded) and `ai-context` finds nothing that describes the replaced admin review UI (Step 7); D157-D159 contain no SEC id; `yarn format:check` is clean for the touched files.

- [ ] **Step 1: Baseline greps (the "failing test")**

Run:

```
grep -rniE "WorkflowStateChangedEvent|workflows\.own|overlay" docs/.bruno/workflows ai-context --include='*.md' --exclude-dir=design
grep -rnE "SEC-[0-9]+" docs/.bruno/workflows docs/.bruno/specs docs/.bruno/plans/2026-10-05-workflows-refactor-roadmap.md ai-context --include='*.md' --exclude-dir=design
grep -n "D1-D1[0-9][0-9]" docs/.bruno/specs/2026-10-05-workflows-refactor-design.md docs/.bruno/plans/2026-10-05-workflows-refactor-roadmap.md
```

Expected at plan time: the first grep hits `docs/.bruno/workflows/app.md` (lines 31, 35, 50, 130, 135, 136, 178), `integrations.md` (132, 138, 143), `decisions.md` (346, D60) and the spec section 12 (line 487), plus unrelated `ai-context/plans/trash-bin-di-refactor.md` and two `ai-context/prds/*.md` lines about other overlays (the trash bin overlay, an image overlay), which stay untouched: they do not describe the workflows UI. The second grep finds nothing (SEC ids live only in the gitignored `docs/.reports/security.md` and in plan files). The third shows the spec status line (`D1-D137`) and the roadmap header (`D1-D156`).

- [ ] **Step 2: Check every claim against the as-built code**

For each line of the checklist, run the command and fix the doc text in the later steps if the code differs (the contract names are the expectation; a rename found here is recorded in the commit body):

```
grep -rn "REVIEW_SYSTEM_WORKFLOW_SELECTION" packages/app-workflows/src/review/gateway/reviewFields.ts
grep -rn "ReviewUseCases" packages/app-workflows/src/review/useCases/ReviewUseCases.ts | head -3
grep -rn "createAbstraction" packages/app-headless-cms-workflows/src/features/gateway/CmsReviewUseCases.ts packages/app-website-builder-workflows/src/features/gateway/WbReviewUseCases.ts
grep -rn "ActiveReviewGuard\b" packages/app-workflows/src/review/trash/ActiveReviewGuard.ts | head -3
grep -rn "ReviewChangedEvent\|eventType" packages/app-workflows/src/review/events/ReviewChangedEvent.ts
grep -rn "WORKFLOWS_NOTIFICATION_ACTION" packages/app-workflows/src/review/domain/constants.ts
grep -rn "name=\"workflows\.\(cms\|wb\)\.\(review\|requested\|contentReviews\)\"\|workflows\.\(cms\|wb\)\.\(review\|requested\|contentReviews\)" packages/app-workflows/src packages/app-headless-cms-workflows/src packages/app-website-builder-workflows/src | head
grep -rn "candidateTeams" packages/api-workflows/src --include='*.ts' -l | head -5
grep -rn "deletePageRevision" packages/api-website-builder/src/graphql/pages/pages.gql.ts packages/app-website-builder/src/features/pages/deletePageRevision/DeletePageRevisionGateway.ts
grep -rn "revisionId" packages/api-website-builder-workflows/src/graphql/WebsiteBuilderWorkflowsSchemaFactory.ts | head -5
grep -rn "ReviewListTab\b" packages/app-workflows/src/review/presentation/reviewList/abstractions.ts | head -3
ls packages/app-workflows/src/review packages/app-workflows/src/review/presentation packages/app-workflows/src/review/testing
grep -rn "userDisplayName" packages/api-workflows/src --include='*.ts' -l | head -3
grep -rn "cancelledBy" packages/api-workflows/src --include='*.ts' -l | head -3
grep -rn "extends ReviewUseCases\|extends ReviewCacheSyncHandler" packages/app-headless-cms-workflows/src packages/app-website-builder-workflows/src | head
grep -rn "Identity.teams\|teams" packages/app-workflows/src/review/presentation/reviewList/ReviewListPresenter.ts | head -3
grep -rn "still need your confirmation" packages/app-workflows/src/review/trash --include='*.ts' --include='*.tsx' | grep -v test | head -3
```

In the same pass read, so the prose below is true: the four tab names and the `failedSteps` kind (`ReviewListTab` has four values; `ReviewListKind` still lists `failedSteps`), the toast texts (`getReviewToastText`), the drawer sections (`ReviewDetailsPresenter`), the three removal facts (`routes.ts` and `ContentReviews.tsx` gone, Task 37), and the A72 finding recorded in the commits of Tasks 31-32 (`git log --format=%B -n 1 -- packages/app-headless-cms/src/features/contentEntry/bulkAction/BulkActionGateway.ts`; the text below assumes the finding "refusals inside the background task are not visible to the client", R228: if a task found otherwise, rewrite the limitation sentence in the roadmap and in 13.8 to what the commit says).

- [ ] **Step 3: Decisions (`docs/.bruno/workflows/decisions.md`)**

Append at the end of the file (after D156, blank line first). Format as the neighbours (heading `## D<n>. Title`, body, last paragraph "Covers ... Decided ..."):

```markdown

## D157. Trash and delete warning driven by the server refusal

The normal trash or delete confirmation runs first. The server refuses with `Workflows/Review/ActiveReviewOnTrash` (D134); the admin then shows a warning that lists the blocking reviews as "{title} · Step {n} of {m} ({step name})" under the D134 text ("This content has a review in progress. Trashing it cancels the review.", "Deleting it cancels the review." for a delete). **Confirm** calls the app's cancel-for-delete wrapper (`CancelCmsEntryReviewsForDelete`, `CancelWebsiteBuilderPageReviewsForDelete`), once per distinct target and scoped to the revision when one revision is deleted, and then repeats the action once, with no second confirm. **Dismiss** changes nothing. Any other error is shown as before. The rule covers trash, single revision delete, permanent delete and bulk delete; for a bulk run the refusals of the whole run are collected, one warning lists every blocking review, and only the blocked items are retried. The one gap: a bulk action over "all selected" content runs as a background task, and refusals inside the task are not visible to the client, so that path has no pre-warning.

Two documented exceptions to "normal dialog first": the Website Builder revision delete has no first confirmation dialog in the admin, so there the warning is the only dialog (the order does not apply); and the CMS bulk dialog is a generic dialog, so the named warning stacks over the busy bulk dialog. A bulk retry replaces the results report with the retried items only (accepted, Q27; the first pass shows one `Notifications.warning` toast "{done} of {total} items done. {n} still need your confirmation.", copy approved by the user, Q28). During a bulk run the per-item decorators record the refusal and report the item as not deleted instead of throwing. The phase also fixes a base CMS bug the flow exposed: `RevisionsListPresenter.deleteRevision` never deleted a revision because of an inverted confirm check, and several callers ignored a `false` result (separate `fix` commits).

The base gateways of both apps (CMS delete, delete revision, permanently delete, bulk action; WB delete page, delete page revision, trash bin delete, trash bin bulk action) throw one typed `GraphQLOperationError` that carries the error code and data, so the workflows packages decorate the use cases and react to the code; nothing else in those gateways changes.

**Supersedes** the order in D134 points 1 and 3 ("the warning first, then the normal trash dialog"). The cancel-for-delete confirm path and the rule that anyone who may trash or delete the content may confirm stay as D134 says.

Covers R204, R205, R228, R249. Decided 2026-10-16 (phase 8a plan, user answers Q3, Q4, Q20, Q25, Q27, Q28).

## D158. Review steps carry `candidateTeams`

A review step carries `candidateTeams: [{ id, name }]` next to `candidateTeamIds`, so the client can write "Waiting in the {Team} team pool" and "Team pool ({names})" (spec 13.4). It is resolved at read time in `api-workflows` from `candidateTeamIds` and never stored. Team lookup needs the `security.team` permission that a reviewer does not have, so exactly that lookup (and nothing else) runs without authorization and exposes only `id` and `name`; ids are de-duplicated, the order of `candidateTeamIds` is kept, an unknown team is omitted, and a failed lookup never fails the review read (the field resolves to the teams it could read). The shared `WorkflowsReviewStep` type carries it, so the CMS and Website Builder responses expose it without a wrapper change.

**Revisits** the phase 7 assumption A62 ("no team names") for the client only: the phase 7 websocket and e-mail texts keep "the team pool"; team names there are a later follow-up.

Covers R208, R232. Decided 2026-10-16 (phase 8a plan, user answer Q7).

## D159. Shared admin core in `app-workflows`, app-owned documents and glue

`app-workflows` holds everything that is app-neutral: the gateway interface, the one shared `ReviewUseCases` implementation (orchestration, mapping, error mapping, the workflow list cached per namespace), the DTOs, field fragments and mappers of the shared `Workflows*` types, the presenters, views, dialogs, reviewer picker, toasts, activity and notification handling, the cache-sync handler, the editor session, the trash and delete warning flow and the mounting components. It knows no app and has no namespace registry. Each app package (CMS, Website Builder) owns only: its GraphQL operation documents and the gateway that runs them, the registration that binds its gateway to the shared use cases under its own tokens (so both apps coexist in one admin container, each with its own cache), a content adapter (content URL and content type label), a cache writer, and thin glue at app-specific extension points (editor decorators, list field selection, route and widget mounting). No logic is duplicated across the two app packages; shared presenters depend on the use-case interfaces, never on a gateway. Content Reviews exists once per app and the shared list works on app-neutral rows through a row provider, so a later global view can combine several apps without changing it. A shared class is never bound with `createImplementation` (the binding is stored on the class, so a second app would overwrite the first); each app subclasses it once in its own `<App><Name>Impl.ts` and binds the subclass under its own token (R237). Test fixtures and fakes live in `review/testing/` of `app-workflows` (R243).

**Supersedes** the pre-8a layout in which each app package carried copies of the review logic and one shared presenter singleton served every view. Spec 13.1 "gateways are per app" stays, now with shared use cases above them.

Covers R202, R206, R211-R213, R223, R224, R237, R238, R243, R245. Decided 2026-10-16 (phase 8a plan, user answers Q1, Q5, Q10, Q11, Q13).
```

Then two small in-place edits in the same file:

1. After D134's last sentence, mark the superseded order. Replace the paragraph's last line

```
Refines D62, D79, D80 and D84 (spec 4.5, 5.1, 9.2, 9.3).
```

with

```
Refines D62, D79, D80 and D84 (spec 4.5, 5.1, 9.2, 9.3). The order of the warning and the normal dialog in points 1 and 3 is superseded by D157.
```

(the line `Refines D62, D79, D80 and D84 (spec 4.5, 5.1, 9.2, 9.3).` is unique; `grep -n "^Refines D62, D79, D80 and D84" docs/.bruno/workflows/decisions.md` shows line 757 at plan time).

2. D60 (line 346 at plan time) says the client fires `WorkflowStateChangedEvent`. Replace the sentence

```
On the client, every workflow websocket message also fires `WorkflowStateChangedEvent`, so the open bar, lists and editor refetch (editor reloads the entry if content changed).
```

with

```
On the client, every workflow websocket message goes to the shared review notification service, which shows the toast and signals the review activity bus, so the visible lists and widgets of that app refetch once per signal (R210, R223); `ReviewChangedEvent` (R213) replaces `WorkflowStateChangedEvent` and keeps the content lists' `system.workflow` cache in sync. The editor reloads the entry if content changed (9a).
```

and append ` Refined in phase 8a.` before `Resolves P9, A7.`; if the editor reload claim cannot be verified in Step 2, drop the last sentence ("The editor reloads ... (9a).") instead of keeping it.

- [ ] **Step 4: Spec (`docs/.bruno/specs/2026-10-05-workflows-refactor-design.md`)**

Edit in this order (each `old` text is unique; copy it exactly):

1. Status line (line 3). Replace `Status: draft, 2026-10-05, updated 2026-10-13 (` with `Status: draft, 2026-10-05, updated 2026-10-16 (phase 8a: D157 trash and delete warning driven by the server refusal; D158 review steps carry team names; D159 shared admin core in app-workflows), earlier updated 2026-10-13 (`, and `Consolidates decisions D1-D137` with `Consolidates decisions D1-D159`.

2. Section 4.2, the step shape. After the line

```
    candidateTeamIds: string[];          // resolved on step reached [D21]
```

add

```
    candidateTeams?: { id: string; name: string }[];   // read only: derived from candidateTeamIds when the review is read, never stored; unknown teams omitted [D158]
```

3. Section 5.1, the trash bullet (line 235). Replace

```
The admin warns ("This content has a review in progress. Trashing it cancels the review."); on confirm it calls the app's cancel-for-delete wrapper (`CancelCmsEntryReviewsForDelete`, `CancelWebsiteBuilderPageReviewsForDelete`) and repeats the action.
```

with

```
The admin shows the normal trash or delete confirmation first; when the server refuses, it warns and lists the blocking reviews ("This content has a review in progress. Trashing it cancels the review."); on confirm it calls the app's cancel-for-delete wrapper (`CancelCmsEntryReviewsForDelete`, `CancelWebsiteBuilderPageReviewsForDelete`, scoped to the revision when one revision is deleted) and repeats the action once, with no second confirm [D157].
```

4. Section 9: after the last paragraph of 9.5 ("Audit logs", ends before `## 10. GraphQL surface (outline)`), add before that heading:

```markdown
### 9.6 api-website-builder

- `deletePageRevision(id: ID!)` on `WbMutation`: deletes one revision of a page through the CMS entry-revision path on the private page model, so the CMS rules apply unchanged (deleting the latest revision makes the previous one the latest; deleting the only revision deletes the page and publishes the page-delete events as well; a published revision is deletable exactly as a page is today, no unpublish step is added). Permission `WbPermissions.canDelete("page", page)`. No storage key, model or schema change. Workflows refuses it while the revision has a review in progress (same `Workflows/Review/ActiveReviewOnTrash` code and data as the CMS) and deletes the revision's reviews afterwards [D157].
```

5. Section 10. In the `websiteBuilder` root line replace `cancelWebsiteBuilderPageReviewsForDelete(pageId, action)` with `cancelWebsiteBuilderPageReviewsForDelete(pageId, revisionId, action)` (`revisionId` optional: only that revision's reviews when given, every revision of the page when omitted). After the line beginning `Review reads (steps preview, review details) include each step's` add the sentence `Each review step also returns `candidateTeams { id name }`, resolved from `candidateTeamIds` [D158].` (append to that line, same paragraph). Also append: `Each skip entry of a step returns `userDisplayName` (resolved server-side, name only) and the review returns `cancelledBy { id displayName }`, the actor stored when the review was cancelled [R251, R252].` (same paragraph).

6. Section 12, the last client bullet (line 487). Replace

```
- On the client every workflow websocket message also fires `WorkflowStateChangedEvent`, so the open bar, lists and editor refetch; the editor reloads the entry when its content changed.
```

with

```
- On the client every `workflows.notification` message goes to one shared service: it shows the toast and signals the review activity bus, and the visible Content Reviews lists and dashboard widgets of that app refetch once per signal (own actions signal the same bus); there is no polling. New reviews appear in a list only through "New reviews are available." and Show. `ReviewChangedEvent` keeps the content lists' `system.workflow` cache in sync [D60, D157].
```

(drop the editor-reload claim; Step 2 confirms the sentence matches the code).

7. Section 13: replace the whole of 13.1, 13.3, 13.4 and 13.5 with the text below and add 13.8 after 13.7. Keep 13.2, 13.6 and 13.7 as they are.

```markdown
### 13.1 Architecture

- Keep the DI + MobX presenter pattern. Presenters are transient: each target view, dialog, request dialog, details drawer, list and widget gets its own instance [D71]; singletons are services (activity bus, toasts, notification service, trash collector and guard), each app's gateway and use cases, and each editor's session.
- The shared core lives in `app-workflows` and knows no app: domain types, DTOs, field fragments and mappers of the shared `Workflows*` types, the gateway interface, one shared `ReviewUseCases` implementation, presenters, views, dialogs, toasts, activity and notification handling, the cache-sync handler, the trash and delete warning flow and the mounting components. There is no namespace registry [D159].
- Each app package (CMS, Website Builder) owns only what differs: GraphQL operation documents and the gateway that runs them, the registration binding its gateway to the shared use cases under its own tokens, a content adapter, a cache writer and thin glue at app-specific extension points. Shared presenters depend on use-case interfaces, never on a gateway; no logic is duplicated across the app packages [D159]. The six shared configuration operations (settings, users, step types, notification transports, automation definitions, AI tools) have one gateway [D132, D133].
- Gateways return the `{ data, error }` envelope; the shared use cases turn `error` into a typed `GraphQLOperationError` (`@webiny/app`) that keeps `code`, `message` and `data`, and presenters map by code. The base CMS and Website Builder delete gateways throw the same error [D157].
- Per-viewer flags come from the server; the client invents no rights.
- Mouse and keyboard only; no touch behaviour (Q26).
- Workflows decorators and registrations exist only when the `advancedPublishingWorkflow` feature is on; without it CMS and Website Builder are unchanged. Each app loads its workflow list once and caches it per namespace; the editor shows the bar only for content with a bound workflow.
- Every workflow toast, including confirmations of the user's own actions, goes through the admin `Notifications` stack [D102, D125].
```

```markdown
### 13.3 Request review dialog

- The dialog previews the workflow's steps (title, type, how the owner is chosen, description). For each step with `allowManualPick`, a choice between automatic (preselected) and "Choose a person"; all picks are captured in one dialog and sent only for steps with a person chosen.
- The picker (`ReviewerPicker`, over the admin autocomplete) uses `listStepCandidates`; candidates arrive unpaged and are searched on the client. Excluded users show as "Unavailable", with the reason only when the server returns one (`editor` / `reassign`) [D22, D72, D97].
- The title is prefilled with the content title and needs at least 5 characters; the server stays authoritative [D100, D135].
```

```markdown
### 13.4 Review view (bar, tooltip, dialogs, details)

- The bar shows a loading state, a failed state with "Try again" (and a no-access variant), no bar for content without a workflow, and for an active review the review state tag, the current step and owner, a progress popover and a tooltip. Editing and publishing are unavailable while the status is loading or failed.
- All six step states (pending, awaiting, in review, approved, rejected, failed) render in the tag, popover and details. A failed step shows the generic in-review message in 8a; Restart, the running and failed messages, run history, AI issues and the Background task link arrive with 8b.
- Actions come from server flags: request review, start (confirmed [D114]), take over (checkbox to notify the previous owner [D111]), reassign, approve, reject, cancel. Conflicts ("Someone else acted first") keep the dialog open, collapse it to Close and re-read the review; a typed comment is kept. Own actions end with a toast.
- The Review details drawer (D88) shows the header, the timeline with owner, "Why this owner" (hidden for AI and automation), times, comment and the skipped-by-assignment box exactly as received [D89]; it opens from the bar and from a list row, as presenter state (no route).
- Editor rules: editing is open without a workflow and without an active review; publishing needs no workflow or an approved review; an approved revision that was unpublished keeps "Review: Approved" and can be published again [D121]; moving is disabled while the revision is in review (the CMS list Move action too); an unpublished page that was reviewed can be published again with no new review (a page published before the workflow was bound has no review and the server refuses with `Workflows/Review/PublishBlocked`, shown as an error toast); the Website Builder shows the bar for every page status, hides "New Revision" while a review is in progress and offers "Create new revision" on a rejected page [D24]. A disabled Publish stays visible, `aria-disabled`, with its reason.
- Team pool owners read "Waiting in the {Team} team pool" with the names from `candidateTeams` [D158]; the bar names the viewer's own teams among them (the viewer's team names come from the admin `Identity`, no API change). Only a failed step is shown in a destructive (red) tag; the Rejected tag is neutral-dark for the review as a whole and for a step alike, while the progress segments keep the design's red for rejected steps (Q29, Q30).
- The skipped-by-assignment box shows the display names of the skipped people (resolved server-side, name only); a cancelled review reads "{Name} cancelled this review at {time}." from the stored cancelling actor (`cancelledBy`; reviews cancelled before 8a read "Someone cancelled this review at {time}.").
- Permissions follow the content: each app's own GraphQL carries that app's content permission checks, so a `Workflows/NotAuthorized` read happens only for a viewer without access to the content and shows the no-access state; the lock cannot hit a user who can edit the content.
```

```markdown
### 13.5 Lists and dashboard

- Content Reviews exists once per app (CMS, Website Builder), each with four lists over that app's reviews: Assigned to me, Pool, Team in review and My requests. The Failed steps list arrives with 8b. Sorting is by `lastChangedOn` only; search, a content type filter (CMS only), "Any review state" and "Any step state" (My requests only); load more by cursor [D47, D112, D113, D119, D133].
- The list view and presenter work on app-neutral rows through a use-case interface and a row provider, and row links and actions resolve per row namespace, so a later global Content Reviews view can combine several apps without changing the view. No global route exists yet.
- Live updates: the visible list refetches after the user's own actions and on every incoming `workflows.notification` for its namespaces; new reviews are announced with "New reviews are available." and appear on Show; no polling [D60].
- Empty states of the Assigned to me and Pool lists name the viewer's own teams (from the admin `Identity`).
- Dashboard widgets per app: "For me to review" (segments Assigned to me, Pool) and "My requests", five rows each, "View all" opens the matching list of that app [D71, D133].
- CMS and WB content lists: row selectability reads `system.workflow.reviewState`; nothing else changes [D70].
```

```markdown
### 13.8 Trash and delete warning

- The normal trash or delete confirmation runs first. When the server refuses with `Workflows/Review/ActiveReviewOnTrash`, a warning lists the blocking reviews; Confirm cancels them through the app's cancel-for-delete wrapper (scoped to the revision for a revision delete) and repeats the action once; Dismiss changes nothing. Trash, revision delete, permanent delete and bulk delete all use the one shared guard [D157].
- A bulk delete collects the refusals of the whole run, shows one warning and retries only the blocked items. A bulk action over "all selected" content runs as a background task; refusals inside the task are not visible to the client, so that path has no pre-warning. A bulk retry's results dialog lists only the retried items; the first pass shows a `Notifications.warning` toast "{done} of {total} items done. {n} still need your confirmation." (copy approved by the user, Q28).
- The Website Builder revision delete has no first confirmation dialog, so the warning is its only dialog. A trashed WB page cannot have an active review, so the WB trash bin has no hook; the CMS trash bin is covered by the `PermanentlyDeleteEntryUseCase` decorator.
```

If Step 2 shows the as-built code differs from a sentence (the four tabs, the toast stack, the drawer sections, the bulk retry), change the sentence, not the code.

- [ ] **Step 5: Roadmap (`docs/.bruno/plans/2026-10-05-workflows-refactor-roadmap.md`)**

1. Header (line 7): replace `D1-D156` with `D1-D159`.
2. Row 7, the closing sentence. Replace

```
Client work left for 8a, 8b and 9a: the take-over checkbox, the toast, `WorkflowStateChangedEvent`, and the "Notify via" list, which must move from the stale `listWorkflowNotificationTypes` gateway in `app-workflows` to `listNotificationTransports`
```

with

```
Client work left after phase 8a (built there: the take-over checkbox, the toast, `ReviewChangedEvent` in place of `WorkflowStateChangedEvent`): the "Notify via" list (9a), which must move from the stale `listWorkflowNotificationTypes` gateway in `app-workflows` to `listNotificationTransports`
```

3. Row 8a. Replace the opening `Per-app gateway implementations (CMS, WB) behind a gateway abstraction in app-workflows; shared presenters only where truly app-neutral; gateways keep error code/data; per-view presenters;` with `Shared core in app-workflows (use cases, presenters, views, dialogs) over a gateway interface, with per-app gateways, registration and glue (D159); gateways keep error code/data; per-view presenters;` and the end `delete the old admin review UI | 3, 4 | 13.1, 13.3-13.5 |` with:

```
delete the old admin review UI. **Built** (plan `docs/.bruno/plans/2026-10-16-workflows-phase-8a/`, ten sub-phases): everything above plus the Review details drawer (D88), all six step states, reviewer picker, `candidateTeams` on review steps (D158), the extended toast stack (D125), `GraphQLOperationError` in `@webiny/app`, the trash and delete warning driven by the server refusal (D157, covering revision delete and bulk), and, at the user's request, the Website Builder `deletePageRevision` mutation with its workflows block and the revision-scoped cancel-for-delete; the skipped-entry display names and the stored `cancelledBy` of a cancelled review (API, user answers Q21, Q23); the old review UI is deleted, the workflow editor, notification types and permissions stay for 9a and 9c. Spec 13.1, 13.3-13.5 and 13.8 describe the result | 3, 4 | 13.1, 13.3-13.5, 13.8 |
```

4. Row 8b. Replace `Failed/running states, restart, Failed steps tab (D112), \`runs\` history, AI issues display, websocket refetch | 5, 6, 7, 8a |` with:

```
Failed/running states, restart, Failed steps tab (D112), `runs` history, AI issues display, websocket refetch. **8a hands over:** Restart (`restartStep` on the gateway interface and use cases), the running and failed messages of the bar, popover and drawer (a failed step shows the generic in-review text today), the attempts list, AI issues table and Background task link in the details drawer (`runs`, `issues` and `taskId` are mapped but not rendered), the Failed steps tab (`ReviewListKind` already lists `failedSteps`), extending the live-update bus (`ReviewActivity`, `ReviewNotificationService`) to the new events, and the known gap of the bulk delete over "all selected" content, whose refusals inside the background task are invisible to the client (no pre-warning, D157) | 5, 6, 7, 8a |
```

Cell edits keep the pipe structure of the row; check with `grep -c '^| 8[ab]\.' docs/.bruno/plans/2026-10-05-workflows-refactor-roadmap.md` (2) and that each row still has the same number of `|` separators as before (`awk -F'|' '/^\| 8[ab]\./ {print NF}'` prints the same number for both rows and the neighbours).

- [ ] **Step 6: Guides (`docs/.bruno/workflows/`)**

**6a. `app.md`**: rewrite in place (the file is a discovery snapshot of the old UI; keep the editor notes of section 3 and the editor bugs of section 7, replace the rest with the as-built description). Run from `docs/.bruno/workflows`:

First fix the one stale sentence inside section 3 (line 92): replace

```
  The 6 fields are hand-copied in `WorkflowStepModel` (`domain/WorkflowStepModel.ts:5-39`), `WorkflowStateStepModel` (`domain/WorkflowStateStepModel.ts:5-62`), `WORKFLOW_FIELDS` (`features/graphqlFields.ts:72-88`), `WORKFLOW_STATE_STEP_FIELDS` (`features/graphqlFields.ts:13-34`). Every new step field needs adding in all of them plus API input and type.
```

with

```
  The step fields are hand-copied in `WorkflowStepModel` (`domain/WorkflowStepModel.ts`) and `WORKFLOW_FIELDS` (`features/graphqlFields.ts`). Every new step field needs adding in both plus API input and type.
```

Then assemble (line numbers are those of the file at plan time; check them with `grep -n "^## " app.md` first: sections 1, 2, 3, 4, 5, 6, 7, 8, 9 start at 14, 40, 61, 94, 143, 164, 168, 192, 204, and the kept bug lines are 184, 185 and 190):

```
WORK=$(mktemp -d)
sed -n '61,93p' app.md > "$WORK/section3.md"
sed -n '184p;185p;190p' app.md | awk '{ sub(/^[0-9]+\. /, ""); printf "%d. %s\n", NR + 2, $0 }' > "$WORK/bugs-kept.md"
```

Write `$WORK/partA.md` (title, sections 1 and 2):

```markdown
# Workflows: admin UI (app-workflows)

Notes for `packages/app-workflows` and how the CMS and WB admin packages consume it. Sections 1, 2 and 4-6, 8 and 9 describe the code as built in phase 8a (2026-10-16, D157-D159). Section 3 (the workflow editor) and the bugs of section 7 are the 2026-10-01 discovery notes for the editor code that stays until phases 9a-9c.

Path roots:

- `[AW]` = `packages/app-workflows/src`
- `[CMS]` = `packages/app-headless-cms-workflows/src`
- `[WB]` = `packages/app-website-builder-workflows/src`
- `[API]` = `packages/api-workflows/src`

## 1. Layout, entry points, registration, gating

- Layout of `[AW]`:
  - Editor code (kept until 9a-9c): `domain/` (workflow models, permission schema), `features/{listWorkflows,storeWorkflow,deleteWorkflow,listNotificationTypes,permissions}/`, `presentation/{workflowsEditor,permissions}/`, `hooks/canUseWorkflows.ts`.
  - The shared review core, `review/`: `domain/` (types, enums, error codes, constants, pure functions), `gateway/` (the gateway interface `IReviewGateway`, DTOs, field fragments, mappers), `useCases/` (the use-case interfaces and the one implementation `ReviewUseCases`), `events/`, `cache/`, `activity/`, `toasts/`, `notifications/`, `content/` (the content adapter interface), `presentation/{targetReview,actionDialog,reviewerPicker,requestReview,reviewDetails,reviewList,reviewWidget}/`, `editor/` (editor session and `EditorReviewBar`), `mounting/` (row provider, notification handler, route, menu and widget components), `trash/` (block collector, guard, warning presenter and dialog), `feature.ts`.
- Mounting: `packages/app-serverless-cms/src/Admin.tsx` renders `<WorkflowsAdminApp/>`, `<CmsWorkflows/>`, `<WebsiteBuilderWorkflows/>` in that order, so the shared features are registered before the app features resolve them.
- All three roots return `null` unless `featureFlags.isEnabled("advancedPublishingWorkflow")` (tied to the licence). `WorkflowsAdminApp` registers the permissions, editor and shared review features and `SecurityPermissions`; it has no review route, menu or widget of its own.
- Public API (`[AW]/index.tsx`): `WorkflowsAdminApp`, `useCanUseWorkflows`, `useWorkflowsPermission`, `IWorkflowApplication`, the kept feature objects and `Components.{Permissions,Admin}`. 8a adds nothing to this barrel (R-k): the review core (use-case and gateway types, `ReviewUseCases`, `EditorReviewSession`, `EditorReviewBar`, `ReviewListView`, the widgets, the mounting components, `AppReviewRowProvider`, `ReviewNotificationHandler`, `ReviewCacheSyncHandler`, `ActiveReviewGuard`, ...) is imported by deep `.js` paths (every admin package exports `"./*": "./*"`).
- Routes: none in `[AW]`. Content Reviews routes are per app: `Routes.ContentEntries.ContentReviews` (`/cms/content-reviews`, `[CMS]/routes.ts`) and `Routes.Pages.WorkflowStateList` (`/website-builder/pages/content-reviews`, `[WB]/routes.ts`; the route names are historical). Permissions: `createPermissionSchema({ prefix: "workflows", fullAccess: { editor: true } })` (`[AW]/domain/permissionsSchema.ts`), shown through `Security.Permissions`.

## 2. Architecture pattern

- DI: `@webiny/feature/admin` `createAbstraction` / `createFeature`, `X.createImplementation({ implementation, dependencies })`. Gateways call `MainGraphQLClient` (`@webiny/app/features/mainGraphQLClient/abstractions.js`). No Apollo.
- Layering (D159): shared presenters and components depend on use-case interfaces (`IReviewUseCases` and its parts) and never on a gateway; the one `ReviewUseCases` class calls an app's gateway through `IReviewGateway`. Each app registers `<App>ReviewGateway`, `<App>ReviewUseCases` (a per-app subclass of the shared class, `<App>ReviewUseCasesImpl`, bound to its gateway, singleton, own workflow cache; the shared class is never bound itself, R237) and `<App>ReviewContentAdapter` under its own tokens (`Cms/Workflows/...`, `WebsiteBuilder/Workflows/...`, `Wb/Workflows/ReviewContentAdapter`). Shared presenters receive `useCases` as an `init(...)` argument; app glue resolves its token and passes it in.
- Presenters: MobX `makeAutoObservable`, a `vm` of render-ready values only, transient (a new instance per `useFeature` resolve) so two views never share state; components are `createReactiveComponent`.
- Errors: gateways return the `{ data, error }` envelope; `ReviewUseCases` throws `GraphQLOperationError` (`@webiny/app/errors/GraphQLOperationError.ts`, code, message, data) and presenters map it by code ("Someone else acted first", field errors, no access, transport failure).
- Events and cache: `ReviewChangedEvent` (`workflows.review.changed`) after a target review loads; `ReviewCacheSyncHandler` hands `toSystemWorkflow(review)` to the app's cache writer (`CmsReviewCacheWriter`, `WbReviewPageCacheWriter`) so the content lists show the review state.
- Live updates: `ReviewActivity` signals `{ namespace, source }`; own actions and every incoming `workflows.notification` (`ReviewNotificationHandler` per app, `ReviewNotificationService`) notify it; lists and widgets refetch once per signal. No polling.
- Toasts: `ReviewToasts` and `ReviewNotificationService` use the admin `Notifications` stack with link, duration, position, dismissible and the error variant.
- Extensibility: decorators on each app's extension points (editor components, `ContentEntryFormPresenter`, list field selections and row mappers, the delete use cases), each point decorated once.
- Tests: fixtures and fakes are in `[AW]/review/testing/` (imported `@webiny/app-workflows/review/testing/...` by the app packages, R243); all three packages have jsdom vitest setups; the review core and the app packages are covered, the kept editor code is not.
```

Write `$WORK/partB.md` (sections 4, 5, 6):

```markdown
## 4. Content review flows (as built)

- Editor session: one `IEditorReviewSession { presenter, useCases }` per app (`CmsEntryReview`, `WbPageReview`), singleton, reset on `dispose()`; `EditorReviewBar` renders `ReviewBar` and the details drawer. The CMS form presenter decorator (`CmsEntryFormPresenterReviewDecorator`) and the WB top bar, layout, autosave and publish button (`PageEditorTopBar`, `PageEditorLayout`, `PageEditorAutoSave`, `PageReviewPublishButton`) init the presenter for the open revision and apply `allowsEditing` / `allowsPublishing`.
- `TargetReviewPresenter` statuses: `loading | failed | noWorkflow | none | active`; actions come from the server's `flags`. Dialogs (start, take over, approve, reject, cancel, reassign) load the review by id and share `ReviewActionDialogPresenter`; the request dialog (`RequestReviewPresenter`) previews the steps and takes picks; `ReviewDetailsPresenter` drives the drawer.
- Lists: `ReviewListPresenter` over `IReviewListUseCases` and an `IReviewRowProvider` (app-neutral rows, per-namespace link and actions); `ReviewListView` has four tabs, filters, sorting by last change, load more and the live-update notice; widgets: `ReviewWidgetPresenter` with `ReviewForMeWidget` and `ReviewMyRequestsWidget` (names `workflows.{cms,wb}.{review,requested}`).
- Trash and delete: `ActiveReviewGuard` (`run`, `runBulk`) with `ActiveReviewBlockCollector` and `ActiveReviewWarningDialog` (a named dialog); each app's `features/trash` decorates its delete use cases and the bulk delete presenter (D157).

## 5. GraphQL operations

- Per-app review operations live only in the app packages, one document per file: CMS `[CMS]/features/gateway/graphql/` over the `cms` root (`listCmsEntryWorkflows`, `getCmsEntryTargetReview`, `getCmsEntryReview`, `listCmsEntryReviews`, `listCmsEntryStepCandidates`, `listCmsEntryReviewStepCandidates`, `requestCmsEntryReview`, `startCmsEntryReviewStep`, `takeOverCmsEntryReviewStep`, `reassignCmsEntryReviewStep`, `approveCmsEntryReviewStep`, `rejectCmsEntryReviewStep`, `cancelCmsEntryReview`, `cancelCmsEntryReviewsForDelete`); WB `[WB]/features/gateway/graphql/` over the `websiteBuilder` root (the same set with `WebsiteBuilderPage`, no `modelId`). The shared field fragments are `[AW]/review/gateway/reviewFields.ts`.
- The kept editor gateways still use the `workflows` root: `listWorkflows`, `storeWorkflow`, `deleteWorkflow` and the stale `listWorkflowNotificationTypes` (9a moves it to `listNotificationTransports`).

## 6. Consumer contract

CMS and WB use: `ReviewUseCases` through their own tokens, `EditorReviewSession` and `EditorReviewBar`, the presenters' use-case-typed `init` arguments, `ReviewListView` and the widgets through the mounting components, `ReviewCacheSyncHandler` with their cache writer, `ReviewNotificationHandler` with their content adapter, `ActiveReviewGuard`, and from the editor side `Components.Admin.WorkflowsEditor`, `Components.Permissions.HasWorkflowsEditorPermission`, `IWorkflowApplication` and `useCanUseWorkflows`. The `system.workflow` shape on content is `{ workflowId, reviewState, stepId, stepName, stepState }` (`SystemWorkflowValue`). Details in `integrations.md`.
```

Write `$WORK/partC1.md` (section 7 heading, intro and bugs 1-2: the text above the line `<!-- split -->`) and `$WORK/partC2.md` (sections 8 and 9: the text below it). The marker line itself is not written to either file:

```markdown
## 7. Bugs (open, editor code kept until 9a-9c)

Verified against code on 2026-10-01; the review UI bugs of that snapshot (singleton widget and list presenters, dropped error codes in the review gateways, the approve success dialog, the unguarded `init`) went with the deleted code.

1. `useCanUseWorkflows()` returns `{ canUseWorkflows }` (`hooks/canUseWorkflows.ts:8-10`), but `WorkflowsEditorBase.tsx:28,37` tests `!obj`. Always false; the "no access" alert is dead.
2. The kept editor gateways (`ListWorkflowsGateway`, `StoreWorkflowGateway`, `DeleteWorkflowGateway`, `ListNotificationTypesGateway`) declare only `error: { message }` and throw `new Error(error?.message ...)`, dropping the `code` and `data` already requested by `ERROR_FIELDS`; `FormattedError` therefore always shows empty fields (`FormattedError.tsx:31`). The review gateways do not have this problem (`GraphQLOperationError`).

<!-- split -->

## 8. Duplication and dead code (editor)

- Field lists hand-copied across `WorkflowStepModel`, `WORKFLOW_FIELDS` and the API types.
- The four editor use cases are passthroughs to their gateways.
- Dead: DI `WorkflowsPermissions` (registered, never consumed; the legacy `useSecurity().getPermission("workflows")` is what runs), `StepFormNotifications` (commented out in `Step.tsx`).

## 9. Open for 9a-9c

- The step editor is not type-aware; fields are fixed in `Step.tsx`. Needs a step-type registry or decoratable field slots for assignment config, the rule list, the manual-selection toggle, AI and check config.
- One workflow per app is hardcoded in the editor presenter (`_workflows[0]`).
- Editor saves are fire-and-forget; the workflow list cache of `ReviewUseCases` is not invalidated by a save (a workflow saved in the editor shows in the review UI after a reload, A74; 9a adds invalidation).
- The reviewer picker is a small `ReviewerPicker` (8a); 9b generalises it into the shared `Picker`.
- The editor has no tests.
```

Assemble and replace:

```
cat "$WORK/partA.md" "$WORK/section3.md" "$WORK/partB.md" "$WORK/partC1.md" "$WORK/bugs-kept.md" "$WORK/partC2.md" > "$WORK/app.new.md"
mv "$WORK/app.new.md" app.md
```

(each part file starts and ends with one blank line so the sections stay separated; check `grep -n "^## " app.md` prints sections 1 to 9 in order, and that the kept bug lines read `3.` to `5.`). Verify the carried-over claims in the new text with Step 2's commands before saving; in particular `grep -n "_workflows\[0\]" packages/app-workflows/src/presentation/workflowsEditor/WorkflowsEditorPresenter.ts` (bug text of section 9) and `grep -n "WorkflowsPermissions" packages/app-workflows/src` (the dead-code claim).

**6b. `integrations.md`**: replace lines 34-50 (the `app-headless-cms-workflows` bullets after its heading, the blank line, the `### app-website-builder-workflows` heading and its bullets) and lines 124-147 (the body of section 5, from the blank line after the heading to the blank line before `## 6.`; line 123, the heading `## 5. UI integration points`, stays) with the text below. Re-read the line numbers first (`grep -n "^### app-\|^## 5\|^## 6" integrations.md`: 32, 44, 123, 148 at plan time) and keep the headings `### app-headless-cms-workflows` (line 32), `## 5. UI integration points` and `## 6. ...` as they are.

Replacement for lines 34-50:

```markdown
- Entry: `src/index.tsx` exports `<CmsWorkflows/>`, mounted after `WorkflowsAdminApp` (`app-serverless-cms/src/Admin.tsx`), same feature flag gate.
- `CmsReviewFeature` (`src/features/gateway/feature.ts`): `CmsReviewGateway` (GraphQL documents over the `cms` root), `CmsReviewUseCases` (`CmsReviewUseCasesImpl`, a subclass of the shared `ReviewUseCases` bound to that gateway, singleton, R237), `CmsReviewContentAdapter` (`cms.<modelId>` namespaces, entry URL, model label), `CmsReviewRowProvider` and the `ReviewNotificationHandler`.
- Editor: `CmsEntryReview` (editor session) and `CmsEntryFormPresenterReviewDecorator`; components `CmsEntryReviewBar` (decorates `ContentEntryFormContent`), `CmsEntryReviewFormLock` (decorates `ContentEntryForm`), `CmsEntryReviewBlockedActions` (the disabled Publish, wrapped in the shared `ReviewTooltip`; there is no standalone tooltip component, R241), `CmsEntryReviewScheduleMenuItem` (decorates `MenuItemAction`), `CmsEntryReviewNewRevision`.
- Lists and cache: `CmsReviewListEntriesFieldSelection`, `CmsReviewGetEntryFieldSelection`, `CmsReviewTableRowMapperDecorator`, `CmsReviewMoveEntryAction` (gates the list Move action while a review is in progress), `CmsReviewCacheWriter` (through `ReviewCacheSyncHandler`, patches `ContentEntriesCacheProvider`).
- Content Reviews: route `/cms/content-reviews`, menu `workflows.cms.contentReviews`, widgets `workflows.cms.review` and `workflows.cms.requested`, the sidebar footer item.
- Trash and delete: `features/trash` decorates `DeleteEntryUseCase`, `DeleteEntryRevisionUseCase`, `PermanentlyDeleteEntryUseCase` and the bulk delete presenter through the shared `ActiveReviewGuard` (D157).
- Workflow editor (kept until 9a): `CmsWorkflowsEditorPresenterFeature` (lists models as workflow "apps"), `CmsWorkflowsEditor` (route `/cms/workflows`).

### app-website-builder-workflows

- Entry: `src/index.tsx` exports `<WebsiteBuilderWorkflows/>` (`Admin.tsx`), same gate.
- `WbReviewFeature` (`src/features/gateway/feature.ts`): `WbReviewGateway` (documents over the `websiteBuilder` root), `WbReviewUseCases`, `WbReviewContentAdapter` (`wb.page`, page editor URL), `WbReviewRowProvider`, the `ReviewNotificationHandler`.
- Editor: `WbPageReview` (editor session); `PageEditorTopBar` renders the bar for every page status, `PageEditorLayout` makes the editor read-only from the review state, `PageEditorAutoSave` stops autosave while a review exists, `PageReviewBar` and `PageReadOnlySync` (the read-only flag and its reason), `PageNewRevisionDecorator` (hides the base New Revision button while a review is in progress), and the publish pieces `PageReviewPublishButton` and `PageReviewPublishAction` (`buttonWorkflowPublish`, so an approved page can be published although the editor is read-only), `DisabledPublishButton` (the disabled Publish inside the shared `ReviewTooltip`, R241) and `PageBasePublishDecorator` (hides the base `buttonPublish` when the namespace has a workflow); a rejected page offers the base "Create new revision".
- Lists and cache: `WbReviewListPagesFieldSelection`, `WbReviewGetPageFieldSelection`, `WbReviewTableRowMapperDecorator`, `WbReviewPageCacheWriter`; the change-status action follows `reviewState`.
- Content Reviews: route `/website-builder/pages/content-reviews`, menu `workflows.wb.contentReviews`, widgets `workflows.wb.review` and `workflows.wb.requested`, the sidebar footer item.
- Trash and delete: `features/trash` decorates `DeletePageUseCase`, `DeletePageRevisionUseCase` and the bulk delete presenter (D157; no WB trash-bin hook, R249: a trashed page cannot have an active review); the server side is `deletePageRevision` plus the workflows block (spec 9.6).
- Workflow editor (kept until 9a): `WebsiteBuilderWorkflowsMenu` (route `/website-builder/workflows`, one hard-coded "Pages" app).
```

Replacement for lines 124-147 (section 5 body after its heading; the block starts and ends with one blank line):

```markdown

- The shared review presenters and views live in `app-workflows` (`review/`); the apps pass their own use cases in. `EditorReviewSession` and `EditorReviewBar` give each editor one presenter, one bar and the details drawer; `ReviewListView` and the widgets serve Content Reviews and the dashboard. See `app.md` sections 2 and 4.
- CMS entry editor: `CmsEntryFormPresenterReviewDecorator.loadRevision` inits the session with `{ namespace: cms.<modelId>, targetRevisionId, targetTitle, canRequest, isPublished }` for any revision status and applies `allowsEditing` and `allowsPublishing` to `canSave` and `canPublish`. Singleton models are skipped as before.
- WB page editor: `PageEditorTopBar` inits the session with `{ namespace: "wb.page", targetRevisionId: page.id, ... }` for every page status and disposes on unmount; `PageEditorLayout` is the one source of the read-only flag.
- Pages and entries lists: the field selections add `system.workflow { workflowId reviewState stepId stepName stepState }` and the row mappers read it; the cache writers keep it current after actions and incoming notifications.
- Workflow editors wrap `Components.Admin.WorkflowsEditor` with `apps`.
  - CMS: one app per publishable non-singleton model. Menu entry guarded by `HasWorkflowsEditorPermission` and `canCreateContentModels` (`CmsWorkflowsEditorView.tsx`). Route guarded by `useCanUseWorkflows` + `SecureRoute permission="cms.contentModel"` (`Routes/CmsWorkflowsEditor.tsx`); the view checks `canCreateContentModels` only.
  - WB: one hard-coded "Pages" app. Route uses `SecureRoute permission="wb.page"` (`Routes/WebsiteBuilderWorkflowsMenu.tsx`). No `HasWorkflowsEditorPermission` wrapper on the menu (`PageWorkflowsEditorView.tsx`).

```

Then one line under the `## 6. Duplication, inconsistencies, bugs` heading: `Items below that name the old state bar, \`WorkflowStateCacheHandler\`, \`ToggleEditorMode\`, the old presenters or the unused content-review routes (the inline app-name copy in 4, 5, the admin bullet of 6, 8-11) describe admin code deleted in phase 8a (D159).`

Verify every name in these bullets with Step 2's output and the file listings before saving (`ls packages/app-headless-cms-workflows/src/features packages/app-website-builder-workflows/src/features`).

**6c. `README.md`** (`docs/.bruno/workflows/`):

- Line 9: replace the `app.md` description with ``- `app.md`: `app-workflows` as built in phase 8a (shared review core, per-app gateways and glue, review flows, GraphQL usage), the workflow editor notes and the open editor bugs.``
- Line 21: replace `| \`app-workflows\` | Core admin UI | 192 files, ~7.3k LOC, no tests |` with `| \`app-workflows\` | Core admin UI: shared review core (phase 8a) and the workflow editor | review core tested, editor not |`.
- Bug 6 in the numbered list (line 48): replace it with `6. Admin editor code: gateways drop error \`code\`/\`data\`, \`useCanUseWorkflows\` is misused (always false), fire-and-forget editor saves (\`app.md\` §7). The review UI bugs of the first snapshot went with the old code in phase 8a.`

**6d. `bugs.md`.** B2's admin bullet (line 17 of `bugs.md`: "Admin: `WorkflowsAdminApp` and `app-headless-cms-workflows/src/presentation/feature.ts:12-13` both register `WorkflowsFeature` and `WorkflowStatePresenterFeature`") is already resolved: Task 20 replaced the CMS `presentation/feature.ts` and Task 37 removes `WorkflowStatePresenterFeature`. Replace that bullet in this commit with `- Admin: resolved in phase 8a; \`WorkflowsAdminApp\` registers \`WorkflowsFeature\` once.` Before saving, run `grep -rn "WorkflowsFeature" packages/app-headless-cms-workflows/src packages/app-workflows/src/app.tsx`: it must show the registration only in `app.tsx` (and no `RegisterFeature` of it in the CMS package); if the CMS package still registers it, fix the sentence to say what remains instead of keeping the claim.

- [ ] **Step 7: Final greps (the proof)**

```
grep -rniE "WorkflowStateChangedEvent|workflows\.own|overlay" docs/.bruno/workflows ai-context --include='*.md' --exclude-dir=design
grep -rnE "SEC-[0-9]+" docs/.bruno/workflows docs/.bruno/specs docs/.bruno/handoff/*workflows-phase-8a.md docs/.bruno/plans/2026-10-05-workflows-refactor-roadmap.md ai-context --include='*.md' --exclude-dir=design
grep -n "D157\|D158\|D159" docs/.bruno/workflows/decisions.md | cut -c1-80
grep -n "D1-D159" docs/.bruno/specs/2026-10-05-workflows-refactor-design.md docs/.bruno/plans/2026-10-05-workflows-refactor-roadmap.md | cut -c1-80
grep -c "WorkflowState" docs/.bruno/workflows/app.md
```

Expected: the first grep prints only the unrelated `ai-context` lines of Step 1 (trash bin overlay, image overlay) and nothing in `docs/.bruno/workflows`; the second prints nothing; the third shows the three headings and the D134 and D60 pointer lines; the fourth shows both files; the fifth prints `0`. A hit of the first grep in `docs/.bruno/workflows` is rewritten, not filtered.

- [ ] **Step 8: Local design catalogue (not committed)**

The review screens are implemented. Run `/design-pull mark` for the design files 8a built, with the commit that finished the UI (Task 37). From the repository root:

```
git rev-parse --short HEAD
yarn tsx .claude/skills/design-pull/design.ts list-folders
yarn tsx .claude/skills/design-pull/design.ts mark 'docs/.bruno/workflows/design' 'Content Review.dc.html' --commit '<sha of Task 37>'
yarn tsx .claude/skills/design-pull/design.ts mark 'docs/.bruno/workflows/design' 'Content Review States.dc.html' --commit '<sha of Task 37>'
yarn tsx .claude/skills/design-pull/design.ts mark 'docs/.bruno/workflows/design' 'Content Reviews.dc.html' --commit '<sha of Task 37>'
yarn tsx .claude/skills/design-pull/design.ts mark 'docs/.bruno/workflows/design' 'Content Reviews States.dc.html' --commit '<sha of Task 37>'
yarn tsx .claude/skills/design-pull/design.ts mark 'docs/.bruno/workflows/design' 'Website Builder Review.dc.html' --commit '<sha of Task 37>'
yarn tsx .claude/skills/design-pull/design.ts mark 'docs/.bruno/workflows/design' 'Website Builder Review States.dc.html' --commit '<sha of Task 37>'
```

(all arguments in single quotes, the skill's rule; `HEAD` at this point is the Task 37 commit when Task 38 is the next commit, so the `--commit` value is that `rev-parse` output). Do **not** mark `Notifications.dc.html` (its e-mail and websocket frames are phase 7, its toast frames partial), `Picker.dc.html` (generalised in 9b), `Model Delete.dc.html`, or the `Workflow Editor` and `Workflow Settings` boards (9a-9c). The helper skips a file with a newer pulled version and says so; mention any skip in the handoff. The catalogue and `.implemented/` copies stay untracked (`.git/info/exclude`); never `git add` them.

- [ ] **Step 9: Session handoff**

Create `docs/.bruno/handoff/<YYYY-MM-DD>-workflows-phase-8a.md` (use `date +%F`), in the shape of `docs/.bruno/handoff/2026-10-15-workflows-phases-6-7.md` (title `# Session Handoff — <date> — Workflows phase 8a built`, then `## What was done`, `## Key decisions`, `## Current state`, `## What might come next`). Content, from the real commit log (`git log --oneline` since the phase 7 docs commit; list the sub-phase commit shas, not a count guessed):

- What was done: the ten sub-phases with their commit ranges; the API additions (`candidateTeams`, WB `deletePageRevision` with its workflows block and the revision-scoped cancel-for-delete); admin foundations (`GraphQLOperationError`, extended `Notifications`); the shared review core in `app-workflows`; CMS and WB gateways, editors, lists, widgets, Content Reviews; the trash and delete warning; the old UI deleted; docs (D157-D159, spec 13.x, roadmap, `app.md`, `integrations.md`).
- Key decisions: D157-D159 in one line each; user answers Q1-Q30 in one line (Q16 trailer, Q17 hide WB New Revision in review, Q18 permissions follow content, Q19 unpublished republish, Q21 skipped names, Q23 `cancelledBy` and viewer teams, Q24, Q29 and Q30 tag colours (only Failed destructive; the review-level and step Rejected tags neutral-dark; progress segments red for rejected), Q25 CMS revision-delete fix, Q26 no touch, Q27 bulk retry results, Q28 bulk first-pass toast copy); the rulings R237-R252 in one line each (subclass rule, file conventions, fixtures in `review/testing/`, toast union, `assignedAutomatically`, no private `load()`, no WB trash-bin hook, CMS list Move gating, skipped names, `cancelledBy`); the layering rule (shared core, app glue only); test conventions of the admin packages (composition tests from the gated roots, `yarn test` only, no whole-suite runs); trailer format.
- Current state: branch `bruno/refactor/workflows-flow`, nothing pushed; tests run (per sub-phase list), builds green for `@webiny/app-workflows`, the two app packages and `@webiny/app-serverless-cms`; the known gaps: the bulk "all selected" background-task path has no pre-warning (R228, A72 finding), the workflow list cache is not invalidated on save (A74), phase 7 texts keep "the team pool" (A79), the generalised Picker waits for 9b; the WB revision delete has no first confirm dialog (D157 order N/A); a bulk retry's results show only the retried items (Q27); the admin is desktop only, no touch (Q26); a `Workflows/NotAuthorized` read cannot hit a user with content access (Q18); an unpublished page republishes without a review (Q19), but a page published before the workflow was bound is refused by the server (A89) and the user sees the error toast; skipped `/design-pull mark` files, if any.
- What might come next: 8b (the hand-off list of the roadmap row), then 9a-9c; first action for the next agent: read `docs/.bruno/plans/2026-10-05-workflows-refactor-roadmap.md` rows 8b and 9a, and `docs/.bruno/workflows/app.md` sections 3, 7, 9.

No SEC id in this file. Do not edit `AGENTS.md` or `ai-context/` unless a grep shows them stale: `grep -rln "app-workflows\|WorkflowState" AGENTS.md ai-context` printed nothing at plan time; if it prints a file now, update that file in this commit.

- [ ] **Step 10: Format, pre-commit chain and commit**

Docs only: no package source or `package.json` changed in this task, so `yarn adio`, `yarn check-ts-configs` and the package builds have nothing to prove; they still run as part of the chain.

```
git add .
yarn > /dev/null 2>&1
node scripts/generateTsConfigsInPackages.js
yarn adio
yarn check-ts-configs
yarn format:fix > /dev/null 2>&1
yarn lint:fix
yarn webiny sync-dependencies
git add .
git checkout -- .gitleaks.toml
git status --short
```

`git status --short` must list only the docs files of this task (the three spec, roadmap and decisions files, the three or four guides, the handoff file) and no `docs/.reports`, `.superpowers`, `docs/.bruno/workflows/design/` or `.gitleaks.toml` entry. Then:

```
git commit -m "docs(workflows): record phase 8a (D157-D159), spec 13.x, roadmap and guides as built" -m "Adds D157 (trash and delete warning driven by the server refusal), D158 (review steps carry candidateTeams) and D159 (shared admin core in app-workflows), corrects D60 and D134 for the new client flow, updates spec 4.2, 5.1, 9.6, 10, 12 and 13.1-13.8, marks roadmap row 8a built with the 8b hand-off, refreshes app.md and integrations.md for the as-built admin code and adds the phase 8a session handoff." -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>" -m "Claude-Session: <CURRENT_SESSION_URL>"
```

If any step of the chain fails and you fix something, rerun the chain from the first line.

**Contract notes:**
1. R233 and the Task 38 entry list `docs/.bruno/workflows/design/catalogue.md` and `/handoff` as files to modify. The design folder is excluded locally (`.git/info/exclude`), so the catalogue change is a local `/design-pull mark` run (Step 8) and never part of the commit. The generic `handoff` skill template (AGENTS.md, `ai-context/` build-order, `origin/main` log) does not match this repository; Step 9 follows the real handoff file format of `docs/.bruno/handoff/` instead and checks `AGENTS.md` and `ai-context` only for staleness.
2. The Task 38 entry names `app.md` as "refreshed"; the file is a discovery snapshot of the old UI, so it is rewritten for sections 1, 2, 4-6, 8, 9 and keeps the editor material (Step 6a). `integrations.md` is also edited because its section 5 and admin bullets contain the grep targets (`WorkflowStateChangedEvent`, `WorkflowStateListAppOverlay`); the rest of it (and `api.md`) stays a historical snapshot of phases before 8a and is not refreshed here.
3. Spec 4.2, 5.1, 9.6, 10 and 12 and decisions D60 and D134 are touched in addition to the 13.x and decisions list of the contract, because they state the old order of the warning, the old WB cancel-for-delete signature, the missing `deletePageRevision` and the removed `WorkflowStateChangedEvent`. D157-D159 text is the contract's text (plus the typed-error sentence and the bulk detail from R204 and R228) with no SEC id; the SEC-66 reference of R208 stays in plan files only.
4. The plan files were reconciled to the final contract (R237-R252, Q16-Q30): subclass bindings (`<App><Name>Impl.ts`), no `abstractions.ts` in the two gateway folders, fixtures in `review/testing/`; Step 2 and the file listing are the check. Every as-built sentence rests on tasks written in parallel; Step 2 is the guard. Names the plan fixed (`REVIEW_SYSTEM_WORKFLOW_SELECTION`, `CmsReviewGateway`, `ActiveReviewGuard`, `workflows.{cms,wb}.{review,requested,contentReviews}`, the four tab names) are used as the contract gives them; verify: `getReviewToastText` texts, the editor-reload claim (dropped from spec 12 and D60 unless the code does it), and the A72 finding of Tasks 31-32.
5. The roadmap edits are cell edits inside a markdown table row; the `awk -F'|'` check in Step 5 keeps the column count.
6. Size: about 330 lines of prose across seven files; no code.
