### Task 20: Decisions D160-D164, spec, roadmap and guides

R253-R266, D160-D164 (`../00-shared.md` "Decisions"), the Global Constraint "SEC ids only in plan files", spec 5.1, 7.4, 10, 11, 12, 13.1, 13.4, 13.5, 13.8 as built; roadmap row 8b built. A docs task: no TDD cycle, no code. The proofs are greps before and after, a claim-by-claim check of every statement against the as-built code (Step 2), and the pre-commit chain. **Every claim below is a claim about code Tasks 1-19 built: Step 2 checks each against the tree before the text is written, and a claim the code contradicts is corrected in the doc, never kept.** The 8b task files were written in parallel, so a contract name that a task renamed is fixed here and recorded in the commit body.

- **Decisions:** append D160 (silent review change message), D161 (run tasks kept, workflows reads them), D162 (client gates mirror the workflows permissions), D163 (content reload after an automated step), D164 (pre-check before the CMS bulk trash) to `docs/.bruno/workflows/decisions.md` (last entry today is D159). Notes on D60 (refined by D160), D90 (superseded in part by D161), D140 (cleanup refined by D161) and D157 (gap closed by D164).
- **Spec** (`docs/.bruno/specs/2026-10-05-workflows-refactor-design.md`): status line and decision range; 5.1 (kept run tasks, bulk pre-check sentence); 7.4 (no self cleanup, the step run read); 10 (the three new queries); 11 (Failed steps tab gate); 12 (the change message); 13.1 (permission gates); 13.4 (running and failed messages, restart, attempts, AI issues, task panel, content notice); 13.5 (Failed steps list, live updates); 13.8 (CMS bulk pre-check).
- **Roadmap** (`docs/.bruno/plans/2026-10-05-workflows-refactor-roadmap.md`): header range D1-D164, row 8b built with what stays unbuilt.
- **Guides** (`docs/.bruno/workflows/`): `app.md` (as built: sections 1, 2, 4, 5, 6, 9), `api.md` (new section 11), `notifications.md` (section 8 and 9), `integrations.md` (package bullets, section 5), `ai-tools.md` (cleanup sentence), `README.md` (index line); the UI design brief line that names the Background Tasks admin (`docs/.bruno/specs/2026-10-06-workflows-ui-design-brief.md`).
- **No SEC id** anywhere in the committed files. Plan files may keep them. There is no handoff file in this task (the user decides at the phase end).

**Files:**
- Modify: `docs/.bruno/workflows/decisions.md`
- Modify: `docs/.bruno/specs/2026-10-05-workflows-refactor-design.md`
- Modify: `docs/.bruno/specs/2026-10-06-workflows-ui-design-brief.md` (one line)
- Modify: `docs/.bruno/plans/2026-10-05-workflows-refactor-roadmap.md`
- Modify: `docs/.bruno/workflows/app.md`, `api.md`, `notifications.md`, `integrations.md`, `ai-tools.md`, `README.md`

**Interfaces:**
- Consumes: the whole phase (Tasks 1-19 as committed) and the `## Decisions` and `## Rulings` of `../00-shared.md` (D160-D164, R253-R266, A92-A96, Q32-Q40 of `../00-answers.md`); existing docs as quoted in the steps below (line numbers are those of the files at plan time; every `old` text is unique and is checked by the grep in the step that uses it).
- Produces: the recorded decisions D160-D164 and the as-built documentation, no code. Acceptance: Step 7 prints what it says; D160-D164 contain no SEC id; `yarn format:check` is clean for the touched files.

**How to apply an edit:** each "Replace `old` with `new`" below is an exact-string replacement made with the Edit tool on the named file (`old` must occur exactly once; the checks name the `grep -c` that proves it). "Append after" means: replace `old` with `old` followed by the new text. Table rows of the roadmap keep their pipe structure.

- [ ] **Step 1: Baseline greps (the "failing test")**

Run from the repository root:

```
grep -rnE "cleans itself up|self-cleans|selfCleanup: \"always\"" docs/.bruno/workflows docs/.bruno/specs/2026-10-05-workflows-refactor-design.md --exclude-dir=design | cut -c1-90
grep -rnE "Background Tasks admin" docs/.bruno/workflows docs/.bruno/specs/2026-10-05-workflows-refactor-design.md docs/.bruno/specs/2026-10-06-workflows-ui-design-brief.md docs/.bruno/plans/2026-10-05-workflows-refactor-roadmap.md --exclude-dir=design | cut -c1-90
grep -rnE "arrives? with 8b|for 8b\)|8a hands over|no pre-warning|has no pre-warning" docs/.bruno/workflows docs/.bruno/specs/2026-10-05-workflows-refactor-design.md docs/.bruno/plans/2026-10-05-workflows-refactor-roadmap.md --exclude-dir=design | cut -c1-90
grep -rnE "SEC-[0-9]+" docs/.bruno/workflows docs/.bruno/specs docs/.bruno/plans/2026-10-05-workflows-refactor-roadmap.md ai-context --include='*.md' --exclude-dir=design
grep -n "D1-D1[0-9][0-9]" docs/.bruno/specs/2026-10-05-workflows-refactor-design.md docs/.bruno/plans/2026-10-05-workflows-refactor-roadmap.md | cut -c1-60
grep -c "WorkflowsSecurityPermissionAccessLevel" docs/.bruno/workflows/app.md
```

Expected at plan time: the first grep hits `ai-tools.md:224`, spec 7.4 (lines 321 and 323) and `decisions.md:799` (D140, kept as history with a note); the second hits `decisions.md:520` (D90, kept as history with a note) and the design brief line 271; the third hits `app.md:71`, the roadmap row 8b, spec lines 528, 538, 557 and `decisions.md:927` (D157, history); the fourth prints nothing (SEC ids live only in the gitignored `docs/.reports/security.md` and in plan files); the fifth shows the spec status line and the roadmap header with `D1-D159`; the last prints `0`.

- [ ] **Step 2: Check every claim against the as-built code**

For each line run the command and fix the doc text in the later steps if the code differs (the contract names are the expectation; a rename found here is recorded in the commit body):

```
grep -rn "WORKFLOWS_REVIEW_CHANGED_WEBSOCKET_ACTION\|WorkflowReviewChangedKind" packages/api-workflows/src/domain/notifications/constants.ts packages/api-workflows/src/domain/notifications/types.ts
ls packages/api-workflows/src/features/notifications/ReviewWebsocketSender packages/api-workflows/src/features/notifications/ReviewChangeNotifierService packages/api-workflows/src/features/notifications/handlers | grep -i "change\|Sender"
grep -rn "getReviewChangeRecipients" packages/api-workflows/src/domain/notifications/getReviewChangeRecipients.ts
grep -n "state === \"inProgress\"\|InProgress" packages/api-workflows/src/features/notifications/handlers/ReviewStepApprovedChangeNotifications.ts
grep -n "createdBy\|currentOwnerId" packages/api-workflows/src/domain/notifications/getReviewChangeRecipients.ts
ls packages/api-workflows/src/features/notifications/handlers | grep -c "ReviewStepFailedChange"   # expect 0: a failure sends no change message
grep -rn "selfCleanup" packages/api-workflows/src/features/stepRun/WorkflowStepRunTask/WorkflowStepRunTaskDefinition.ts
grep -n "CleanupTaskSubtreeUseCase\|Could not clean up the background task" packages/api-workflows/src/features/review/DeleteTargetReviews/DeleteTargetReviewsUseCase.ts
grep -rn "class GetReviewStepRunUseCaseImpl\|StepRunNotFound" packages/api-workflows/src/features/stepRun/GetReviewStepRun packages/api-workflows/src/domain/review/errors.ts
grep -rn "canViewStepRunByPermission" packages/api-workflows/src/domain/review/canViewStepRunByPermission.ts
grep -rn "WorkflowsStepRunInfo" packages/api-workflows/src/graphql/WorkflowsSchemaFactory.ts
grep -rn "getCmsEntryReviewStepRun\|listCmsEntryBlockingReviews" packages/api-headless-cms-workflows/src/graphql/CmsWorkflowsSchemaFactory.ts
grep -rn "getWebsiteBuilderPageReviewStepRun" packages/api-website-builder-workflows/src/graphql/WebsiteBuilderWorkflowsSchemaFactory.ts
grep -rn "BLOCKING_REVIEWS_MAX_IDS\|BLOCKING_REVIEWS_CONCURRENCY" packages/api-headless-cms-workflows/src | head -4
grep -rn "getWorkflowsPermissionSet" packages/app-workflows/src/review/domain/getWorkflowsPermissionSet.ts
grep -rn "WorkflowsSecurityPermissionAccessLevel" packages/*/src | head
grep -rn "WORKFLOWS_REVIEW_CHANGED_ACTION" packages/app-workflows/src/review/domain/constants.ts
grep -rn "reviewId\|targetRevisionId" packages/app-workflows/src/review/activity/abstractions.ts
grep -rn "class ReviewChangeMessageHandler" packages/app-workflows/src/review/mounting/ReviewChangeMessageHandler.ts
grep -rn "extends ReviewChangeMessageHandler" packages/app-headless-cms-workflows/src packages/app-website-builder-workflows/src
grep -rn "IReviewContentReloader\|contentReloader" packages/app-workflows/src/review/content/IReviewContentReloader.ts packages/app-workflows/src/review/presentation/targetReview/abstractions.ts
grep -rn "WbPageContentReloader" packages/app-website-builder-workflows/src | head -3
grep -rn "Content updated by" packages/app-workflows/src --include='*.ts' --include='*.tsx' | grep -v test | head -3
grep -rn "isStepRunning" packages/app-workflows/src/review/presentation/targetReview/isStepRunning.ts
grep -rn "restartStep\|getStepRun\|listBlockingReviews" packages/app-workflows/src/review/gateway/IReviewGateway.ts
grep -rn "TargetSync\|StepRunNotFound" packages/app-workflows/src/review/domain/ReviewErrorCode.ts
grep -rn "failedSteps" packages/app-workflows/src/review/presentation/reviewList/reviewListTabs.ts
grep -rn "confirmBlocking" packages/app-workflows/src/review/trash/ActiveReviewGuard.ts packages/app-headless-cms-workflows/src/features/trash/BulkDeletePresenterReviewDecorator.ts
grep -rn "restartCmsEntryReviewStep\|restartWebsiteBuilderPageReviewStep" packages/api-headless-cms-workflows/src/graphql packages/api-website-builder-workflows/src/graphql | head -3
ls packages/app-headless-cms-workflows/src/features/gateway packages/app-website-builder-workflows/src/features/gateway | grep -i "ChangeMessage"
```

In the same pass read, so the prose below is true: the toast texts (`getReviewToastText`, `restarted`), the restart dialog copy (`getActionDialogCopy`, R266), the conflict text (`getConflictMessage`), the tag labels and tooltips (R263, R264), the drawer sections `Attempts`, `Issues reported by the AI`, the task panel heading `Background task` (`getStepRunPanel`), the content notice text and icons (`TargetReviewPresenter`), the Failed steps empty text (`getReviewListEmpty`), and that `WorkflowStepRunTaskDefinition` has no `selfCleanup` line while its comment says the task is kept. If a name or text differs, change the doc sentence, not the code, and list the change under "Contract notes".

- [ ] **Step 3: Decisions (`docs/.bruno/workflows/decisions.md`)**

3a. Append at the end of the file (after D159, one blank line first). Format as the neighbours (heading `## D<n>. Title`, body, last paragraph "Covers ... Decided ..."):

```markdown

## D160. Silent review change message

Workflows sends a second websocket action, `workflows.reviewChanged`, next to `workflows.notification`. It carries ids and the namespace only (`kind`, `reviewId`, `stepId`, `namespace`, `targetId`, `targetRevisionId`; no title, no body) and the client shows no toast for it. `kind` is `requested`, `stepStarted`, `stepApproved` or `stepRestarted`, one handler per event; a failure sends no change message, because the owner of a failed step is AI or automation (no user owner to reach) and the requester already gets the `failed` notification and refetches on it; the `stepApproved` handler sends nothing once the review is no longer `inProgress` (the final approval already sends `approved`). The eight notification events do not also send it. The recipients are the requester and the current user owner, de-duplicated, never the acting user, so the acting user's own tab refreshes through its own action and there is one refetch per action. There is no pool lookup (too heavy for a silent refetch): pool members, and the people who get no toast for a take-over, reassign, reach or final decision, see those changes on reload or after their own action. API-key requesters have no connections, so nothing is sent to them. Both the notifier and the change notifier send through one `ReviewWebsocketSender` (current tenant only, ten recipients at a time, never throws).

On the client the shared `ReviewChangeMessageHandler` turns the message into a review activity signal with source `remote` that carries the review id and the target revision id. The review bar refetches on a signal for its review or its revision, the details drawer on one for its review (it subscribes after its first successful load, and an action taken in the drawer refreshes the bar only through the signal), lists and widgets on any signal of their namespace; a signal that arrives during a load is queued once, and a view ignores the signal of its own action.

**Refines** D60: a websocket message is no longer always a toast. The phase 7 delivery rules (D149) are unchanged.

Covers R253-R255, R260. Decided 2026-10-17 (phase 8b plan, user answer Q32).

## D161. Run tasks are kept, and workflows reads them

The background task of an AI or automation step is no longer cleaned up when it finishes. It is kept until its review is deleted, and `DeleteTargetReviewsUseCase` then cleans up the task subtree of every `taskId` and `runs[].taskId` of every deleted review (a cleanup that fails is logged and never fails the delete). Cancel keeps aborting only. Stuck detection already handles kept tasks.

Workflows reads the task for the admin: the internal `GetReviewStepRunUseCase` (D132) takes `reviewId`, `stepId` and `taskId`, requires the task to be the step's current task or one of its `runs`, and returns `ReviewStepRunInfo` (`taskId`, `status` as `pending`, `running`, `done`, `failed` or `aborted`, `startedOn`, `finishedOn`, `iterations`, `outcome`, `reason`) or `null` when the task record is gone. Outcome and reason come from the review step, never from the task, so a raw error, the task input and output (other than the automation's own run count) and its logs never leave the server (R146). The per-app queries `getCmsEntryReviewStepRun` and `getWebsiteBuilderPageReviewStepRun` run it behind the app's guard (signed in, the app's namespace, read access to the content) and require `editor` or `reassign`. The details drawer shows a "Background task" link per attempt for those viewers; it opens a panel with status, start, finish, iterations and reason (rows without a value are left out).

**Supersedes** D90's link into the Background Tasks admin (that admin hides private tasks and has no link by id), and **refines** D140: the step run task no longer cleans itself up (R179).

Covers R256-R258, R261, R264. Decided 2026-10-17 (phase 8b plan, user answer Q33).

## D162. Client gates mirror the workflows permissions

The admin reads the viewer's `workflows` permission through one pure function, `getWorkflowsPermissionSet(identity)`, which returns `fullAccess`, `editor` and `reassign` (full access is `workflows.*` or `*`; several roles combine). The Failed steps tab shows only with `reassign` or full access, and `?tab=failedSteps` without it opens the default tab; the Background task link shows with `editor` or `reassign` (or full access). These are display gates only: the server keeps every check and the client hides what the server would refuse. The permission values are booleans (`editor: true`, `reassign: true`); the 8a hook compared them with an access-level enum, which was a bug, and `useWorkflowsPermission` is rewritten over the set and returns `{ editor, reassign }`. Granting `reassign` in the role form stays in 9c.

Covers R259. Decided 2026-10-17 (phase 8b plan, user answer Q34).

## D163. Content reload after an automated step

When an AI or automation step finishes while the editor is locked and the revision changed, the editor reloads the revision (the CMS entry form, the Website Builder page) and the review bar shows a success strip "Content updated by {step title}. The editor loaded the latest version." with the icon `auto_awesome` for an AI step and `bolt` for an automation step; the notice stays until the viewer's next action. The reload happens once per finished non-user step and never re-initialises the review presenter. The CMS reload is skipped while the form is dirty and compares the revision timestamps; the Website Builder reload evicts the page from the page cache, reads it again and applies it to the editor, comparing its timestamps (the page editor cannot be dirty during a review, autosave is off). A reloader that throws or finds no change shows no notice. The CMS form's loading overlay shows briefly while the changed revision reloads; this is accepted and the base form is not changed (user answer Q40).

Covers R262. Decided 2026-10-17 (phase 8b plan, user answers Q35, Q40).

## D164. Pre-check before the CMS bulk trash

Before the CMS bulk trash of all loaded rows starts its background task, the admin asks the new CMS query `listCmsEntryBlockingReviews(modelId, entryIds)` for the reviews in progress of those entries, in chunks of 200 ids, and shows the D157 warning when any come back. Confirming cancels them per target (as D157 does) and then starts the task; with none the task starts at once; a dismissed warning starts nothing, and a failed pre-check shows the error toast and starts nothing. The base `BulkDeletePresenter.execute` now reports whether the background task started, and the trash action's "Entries will be trashed in the background" toast and the deselection follow only a started task (a separate `fix(app-headless-cms)` commit, user answer Q39). The query needs a signed-in viewer, returns `[]` for an unbound model, refuses more than 200 ids with `Workflows/Review/Validation`, and lists only entries the viewer can read (the model, its group and the entry). The shared `ActiveReviewGuard` gains `confirmBlocking` for this and `runBulk` is rebuilt on it. Every other bulk path stays as D157 built it; the Website Builder bulk delete runs per item.

**Closes** the gap D157 names for the CMS ("all selected" content ran as a background task whose refusals the client could not see).

Covers R228, R265. Decided 2026-10-17 (phase 8b plan, user answers Q38, Q39).
```

3b. Four notes in place:

1. D60. Append after the line `_Phase 7: delivery is tenant-scoped by the notifier; workflows lists the recipient's connections and sends to the current tenant's ones, and does not use `WebsocketsSendToIdentityUseCase` (D149, R188)._` this new line (blank line before it):

```
_Refined by D160: workflows also sends the silent `workflows.reviewChanged` message (no toast) to the requester and the current owner, and the client refetches on it._
```

and replace `Refined in phase 8a. Resolves P9, A7.` with `Refined in phases 8a and 8b. Resolves P9, A7.`

2. D90. Append after the paragraph `A running AI or automation step shows "Running", the automation or AI name, and start time. Users with `editor` or `reassign` get a link to the run in the Background Tasks admin. A failed step shows the reason, earlier attempts, and Restart for permitted users.` (blank line, then):

```
_Superseded in part by D161: the link is a "Background task" link in the drawer that opens a panel with the run's status, times, iterations and reason, because the Background Tasks admin hides private tasks and has no link by id. Built in phase 8b: the bar and popover read "{Step} running since {hh:mm}" and "{Step} failed: {reason}", the drawer lists the attempts and the AI issues, and Restart is offered to the requester and the operators the server allows (D34, D82)._
```

3. D140. Append after `Covers R168, R179, R180 and user answer Q1. Refines D57, D87. Decided 2026-10-14 (phase 6 plan R168, R179, R180).` (blank line, then):

```
_Refined by D161: the step run task is no longer cleaned up when it finishes; it is kept until its review is deleted (R256)._
```

4. D157. Append after `Covers R204, R205, R228, R249. Decided 2026-10-16 (phase 8a plan, user answers Q3, Q4, Q20, Q25, Q27, Q28).` (blank line, then):

```
_Refined by D164: the CMS bulk trash of all loaded rows now pre-checks by entry ids before it starts its background task, so the gap named above is closed for the CMS._
```

(check each anchor with `grep -c` first: `grep -c "^Covers R168, R179, R180 and user answer Q1" docs/.bruno/workflows/decisions.md` prints 1, and the same for the other three anchors; `grep -c "Refined in phase 8a. Resolves P9, A7." docs/.bruno/workflows/decisions.md` prints 1.)

- [ ] **Step 4: Spec (`docs/.bruno/specs/2026-10-05-workflows-refactor-design.md`)**

Edit in this order (each `old` text is unique; run `grep -c` with a fixed string of it, e.g. `grep -cF "<old>" <file>`, which must print 1):

1. Status line (line 3). Replace `Status: draft, 2026-10-05, updated 2026-10-16 (phase 8a:` with `Status: draft, 2026-10-05, updated 2026-10-17 (phase 8b: D160 silent review change message; D161 run tasks kept and read by workflows; D162 client gates mirror the workflows permissions; D163 content reload after an automated step; D164 pre-check before the CMS bulk trash), earlier updated 2026-10-16 (phase 8a:`, and `Consolidates decisions D1-D159` with `Consolidates decisions D1-D164`.

2. Section 5.1, rules. Append after the line `- Cancel is allowed at any point unless the review is approved or rejected. After cancel, a new request on the same revision starts from step 1 [D25].`:

```
- The background task of an AI or automation step is kept after it finishes and is deleted with its review (the review delete cleans up the task of every attempt); cancel only aborts a running task. Workflows reads a kept task for operators (7.4, 10) [D161].
```

3. Section 5.1, the trash bullet. Append after `After a permanent delete the reviews and their assignment records go with the content [D134].`:

```
 The CMS bulk trash of all loaded rows runs as a background task, so before it starts the admin asks which of those entries have a review in progress and shows the same warning (13.8) [D164].
```

4. Section 7.4. Replace `A task that is gone (the step run task cleans itself up, R179) or cannot be read counts as stuck after a five-minute grace from the step start.` with `A task that is gone (a task is kept until its review is deleted, so a missing one is unusual, D161) or cannot be read counts as stuck after a five-minute grace from the step start.` Replace `The task cleans itself up when it finishes, because every outcome is already on the step [R179, D140]. Private tasks: R180.` with `The task is kept after it finishes and is deleted with its review, so an operator can read its status; every outcome is also on the step [D161, R256]. Private tasks: R180.` Then replace the line `- No step max duration and no watchdog.` with itself followed by:

```
- Reading a run [D161, R257, R258]: the internal `GetReviewStepRunUseCase(reviewId, stepId, taskId)` requires the task to be the step's current task or one of its `runs` (`Workflows/Review/StepRunNotFound` otherwise), reads the task and returns `ReviewStepRunInfo { taskId, status (pending, running, done, failed, aborted), startedOn, finishedOn, iterations, outcome, reason }`, or `null` when the task record is gone. `outcome` and `reason` come from the review step (the attempt record, or the step's own state), times prefer the review's record, `iterations` is the automation's own run count (the task's iterations minus the id waits). The task's input, output, logs and raw error are never returned [R146]. The app wrappers require the guard (signed in, the app's namespace, read access to the target) and then `editor` or `reassign`, else `Workflows/NotAuthorized`.
```

5. Section 10. Append before the sentence `- Operations that take a review id take no model; a request takes the revision id and the server derives the content id from it.` (replace it with the text below followed by that sentence):

```
- Step run read (8b): `getCmsEntryReviewStepRun(reviewId, stepId, taskId)` on `cms` and `getWebsiteBuilderPageReviewStepRun(reviewId, stepId, taskId)` on `websiteBuilder`, each returning `{ data: WorkflowsStepRunInfo, error }` (`WorkflowsStepRunInfo { taskId, status, startedOn, finishedOn, iterations, outcome, reason }`; the shared `WorkflowsStepRun` stays the attempt record), for viewers with `editor` or `reassign` and read access to the content, `data` null when the task is gone [D161].
- Blocking reviews (8b): `listCmsEntryBlockingReviews(modelId, entryIds)` on `cms` returns `{ data: [WorkflowsBlockingReview { reviewId, model, targetId, targetRevisionId, title, stepPosition, stepCount, stepName }], error }` for the reviews in progress of the given entries the viewer can read; at most 200 ids (`Workflows/Review/Validation` above), `[]` for an unbound model [D164].
- The silent websocket action `workflows.reviewChanged` is described in 12 [D160].
```

6. Section 11. Replace `the app wrapper supplies them from the identity and offers Failed steps only with `reassign` [D132].` with `the app wrapper supplies them from the identity and offers Failed steps only with `reassign` [D132]. The admin shows the Failed steps tab only to viewers with `reassign` or full access (a display gate, the server check stays) [D162].`

7. Section 12. Replace the heading `## 12. Notifications [D44, D60, D96, D103, D107, D111, D126, D129, D133, D149-D156]` with `## 12. Notifications [D44, D60, D96, D103, D107, D111, D126, D129, D133, D149-D156, D160]`. Append after the bullet ending `A recipient with no connection gets nothing and that is not an error.` (the `workflows.notification` bullet):

```
- A second, silent websocket action, `workflows.reviewChanged`, tells open views that a review changed: data `{ kind, reviewId, stepId, namespace, targetId, targetRevisionId }` with `kind` `requested`, `stepStarted`, `stepApproved` or `stepRestarted`; no title, no body, no toast. It is sent when a review is requested and when a step starts, is approved while the review stays `inProgress` or restarts (the final approval sends `approved` only), to the requester and the current user owner, de-duplicated, never to the acting user. A failure sends none: the owner of a failed step is AI or automation and the requester refetches on the `failed` notification. There is no pool lookup, so pool members and the people who get no toast for a take-over, reassign, reach or final decision see those changes on reload or after their own action. Delivery is the one tenant-scoped sender of the notification messages; a failure is logged and never fails the review action [D160, D149].
```

Also replace `- The websocket message is one action, `workflows.notification`, with` with `- The toast message is one action, `workflows.notification`, with` (there is now a second, silent action; check `grep -cF` prints 1).

Then append to the last client bullet (replace `` `ReviewChangedEvent` keeps the content lists' `system.workflow` cache in sync [D60, D157]. `` with itself followed by):

```
 The shared `ReviewChangeMessageHandler` turns `workflows.reviewChanged` into a signal with source `remote` that carries the review id and the target revision id and shows nothing; the review bar refetches when it names the bar's review or revision, the details drawer when it names its review (the drawer subscribes after its first successful load, so a failed first load does not subscribe and Try again subscribes on success), lists and widgets on any signal of their namespace; a viewer's own action refreshes once, and an action taken in the drawer refreshes the bar only through the signal (the drawer's `onChanged` stays for conflicts) [D160].
```

8. Section 13.1. Append after `- Per-viewer flags come from the server; the client invents no rights.`:

```
 Two display gates read the viewer's `workflows` permission through one pure function (full access, `editor`, `reassign`): the Failed steps tab (`reassign` or full access) and the Background task link (`editor` or `reassign`); the server keeps every check [D162].
```

9. Section 13.4.
   - Replace `A failed step shows the generic in-review message in 8a; Restart, the running and failed messages, run history, AI issues and the Background task link arrive with 8b.` with `A running AI or automation step (in review with a non-user owner) reads "{Step} running since {hh:mm}" in the bar and the popover and carries the tag Running; a failed step reads "{Step} failed: {reason}" (just "{Step} failed." without a reason) and carries the tag Failed. The tag tooltips read "{Step} is running since {hh:mm}." and "{Step} failed. The requester or an operator can restart it." [D82, D90].`
   - Replace `(checkbox to notify the previous owner [D111]), reassign, approve, reject, cancel. Conflicts` with `(checkbox to notify the previous owner [D111]), reassign, approve, reject, cancel and restart (Restart in the bar, the details drawer and the Content Reviews row, only when the server flag `canRestart` is set). The restart dialog is titled "Restart “{Step}”?" and says when the last attempt failed and why and that the step runs again from the beginning; a toast "Restarted “{Step}”" ("The step is running again.") follows; when someone restarted the step first the dialog stays open with "Someone restarted “{Step}” at {time}. It is running again, so your restart was not saved." [D34, D82]. The cancel dialog of a running step ends with "{Step} is running and will be stopped.". Conflicts`
   - Replace `it opens from the bar and from a list row, as presenter state (no route).` with `it opens from the bar and from a list row, as presenter state (no route). For an AI or automation step it also lists the Attempts, oldest first (`#{n} {start}–{end} {Outcome} {reason}`, the current attempt last, "since {start}" while it runs), and for an AI step the "Issues reported by the AI" (severity Error, Warning or Info, the field or "Whole content", the message, the suggestion or "—"). Viewers with `editor` or `reassign` get a "Background task" link per attempt that opens a panel with Status, Started, Finished, Iterations and Reason (a row without a value is left out; times in full; "This task is no longer available." when the task is gone) [D90, D161]. The drawer refetches when a change message names its review [D160].`
   - Append after `the lock cannot hit a user who can edit the content.` a new bullet:

```

- When an AI or automation step finishes while the editor is locked and the revision changed, the editor reloads the revision (the CMS entry form, the Website Builder page) and the bar shows "Content updated by {step title}. The editor loaded the latest version." with the icon `auto_awesome` (AI) or `bolt` (automation). The CMS reload is skipped while the form is dirty and the reload never re-initialises the review presenter [D163].
```

10. Section 13.5.
   - Replace `each with four lists over that app's reviews: Assigned to me, Team pool, Team in review and My requests. The Failed steps list arrives with 8b.` with `each with four lists over that app's reviews: Assigned to me, Team pool, Team in review and My requests, and a Failed steps list for viewers with `reassign` or full access only (oldest first; search and the content type filter only; empty text "No failed steps" and "AI and automation steps that hit a technical error appear here."; `?tab=failedSteps` without the permission opens the default list), with Restart on each row [D112, D162].`
   - Replace `on every incoming `workflows.notification` for its namespaces;` with `on every incoming `workflows.notification` or `workflows.reviewChanged` message for its namespaces;`

11. Section 13.8. Replace `A bulk action over "all selected" content runs as a background task; refusals inside the task are not visible to the client, so that path has no pre-warning.` with `A CMS bulk trash of all loaded rows runs as a background task whose refusals the client cannot see, so before it starts the admin asks `listCmsEntryBlockingReviews(modelId, entryIds)` for those entries (chunks of 200 ids), shows one warning for the reviews it lists and, on confirm, cancels them per target and starts the task; with none listed the task starts at once, a dismissed warning starts nothing, and a failed pre-check shows the error toast and starts nothing; only entries the viewer can read are listed. The base bulk presenter reports whether the task started, and the trash action's "Entries will be trashed in the background" toast and the deselection follow only a started task [D164]. The Website Builder bulk delete runs per item.`

If Step 2 shows the as-built code differs from a sentence (the tag labels, the copy, the pre-check chunking, the reload rules), change the sentence, not the code.

Also fix the one design-brief line. In `docs/.bruno/specs/2026-10-06-workflows-ui-design-brief.md` replace `Users with Manage workflows or Reassign and operate see a link to each run in the Background Tasks admin [D90].` with `Users with Manage workflows or Reassign and operate see a Background task link per run that opens a panel with its status, times, iterations and reason [D90, D161].`

- [ ] **Step 5: Roadmap (`docs/.bruno/plans/2026-10-05-workflows-refactor-roadmap.md`)**

1. Header (line 7): replace `D1-D159` with `D1-D164`.
2. Row 8b, the middle cell. Replace the text from `**8a hands over:**` to `(no pre-warning, D157)` (everything between the sentence `websocket refetch.` and the closing ` | 5, 6, 7, 8a |`) with:

```
**Built** (plan `docs/.bruno/plans/2026-10-17-workflows-phase-8b/`, eight sub-phases): the running and failed messages, tags, tooltips and popover; Restart in the bar, the drawer and the Content Reviews rows (dialog, toast, conflict handling); the attempts list, AI issues and the Background task panel in the details drawer (run tasks are kept until their review is deleted, D161); the Failed steps tab for viewers with `reassign` (D162); the silent `workflows.reviewChanged` websocket message and the refetch of bar, drawer, lists and widgets (D160); the editor reload with "Content updated by {step}" (D163); the pre-check before the CMS bulk trash of all loaded rows (D164, `listCmsEntryBlockingReviews`). Spec 7.4, 10, 12, 13.4, 13.5 and 13.8 describe the result. **Not built, no phase assigned:** a global Content Reviews route, polling, a stored inbox; a pool lookup for change messages and change messages for the eight toast events; who restarted a step (not stored); task logs, input or output in the admin; a deep link into the Background Tasks admin; a Failed steps dashboard widget; an error-variant toast for the `failed` notification; refusal reporting inside `api-headless-cms-bulk-actions`; the trash bin's own bulk delete. Granting `reassign` in the role form stays in 9c
```

   (the old text ends with `(no pre-warning, D157)` directly before ` | 5, 6, 7, 8a | 13.4, 12 |`; the new text ends with `stays in 9c` for the same reason.)
3. Row 8b, the last cell. Replace ` | 5, 6, 7, 8a | 13.4, 12 |` with ` | 5, 6, 7, 8a | 12, 13.1, 13.4, 13.5, 13.8 |`.

Check the table: `grep -c '^| 8[ab]\.' docs/.bruno/plans/2026-10-05-workflows-refactor-roadmap.md` prints 2, and `awk -F'|' '/^\| 8[ab]\./ {print NF}' docs/.bruno/plans/2026-10-05-workflows-refactor-roadmap.md` prints the same number twice (6 at plan time).

- [ ] **Step 6: Guides (`docs/.bruno/workflows/`)**

**6a. `app.md`** (run `grep -cF` on each `old` first, it must print 1):

1. Intro line: replace `describe the code as built in phase 8a (2026-10-16, D157-D159).` with `describe the code as built in phases 8a and 8b (2026-10-16 and 2026-10-17, D157-D164).`
2. Section 1. Append after the Routes bullet's ending `shown through `Security.Permissions`.` this new bullet (blank line not needed, a new list line):

```

- Permissions in the admin (8b, D162): `getWorkflowsPermissionSet(identity)` (`[AW]/review/domain/getWorkflowsPermissionSet.ts`) returns `{ fullAccess, editor, reassign }` (`fullAccess` is `workflows.*` or `*`; several roles combine). `useWorkflowsPermission` returns `{ editor, reassign }` over it; `IWorkflowsSecurityPermission` is `{ name, editor?, reassign? }` and `WorkflowsSecurityPermissionAccessLevel` is gone (the stored values are booleans, the old comparison with the enum was a bug). Presenters read the identity through `IdentityContext`. The server keeps every check; these are display gates (the Failed steps tab, the Background task link).
```

3. Section 2. Replace the whole `- Live updates: ...` bullet (it starts with ``- Live updates: `ReviewActivity` signals `{ namespace, source }`;`` and ends with `No polling.`) with:

```
- Live updates: `ReviewActivity` signals `{ namespace, source, reviewId, targetRevisionId }` (the two ids are `null` when the caller has none). Own actions, every incoming `workflows.notification` (`ReviewNotificationHandler` per app, `ReviewNotificationService`, with a toast) and every silent `workflows.reviewChanged` (`ReviewChangeMessageHandler`, a shared plain class in `[AW]/review/mounting/`, subclassed per app as `CmsReviewChangeMessageHandlerImpl` and `WbReviewChangeMessageHandlerImpl`; source `remote`, no toast) notify it. Lists and widgets refetch once per signal of their namespace, and a signal that arrives during a load is queued and applied once after it. `TargetReviewPresenter` (the bar) refetches on a signal for its review or its revision and `ReviewDetailsPresenter` (the drawer) on one for its review (it subscribes after its first successful load, because its init params carry no namespace; a failed first load does not subscribe and Try again subscribes on success, and an action taken in the drawer refreshes the bar only through the signal, its `onChanged` stays for conflicts); both ignore a signal raised by their own `notify` call, so their own action refreshes once, and both keep at most one refetch queued during a load. A later `init` or `dispose` drops the subscription. No polling (D160).
```

4. Section 4. Replace ``` `ReviewListView` has four tabs (Assigned to me, Team pool, Team in review, My requests; `ReviewListKind` also lists `failedSteps` for 8b) ``` with ``` `ReviewListView` has up to five tabs (Assigned to me, Team pool, Team in review, My requests, and Failed steps for viewers with `reassign` or full access; `?tab=failedSteps` without the permission opens the default tab) ```. Then append after the trash bullet's ending `decorates its delete use cases and the bulk delete presenter (D157).` these sentences and new bullets:

```
 For the CMS bulk trash of all loaded rows the bulk decorator asks `listBlockingReviews` per chunk of 200 entry ids first and shows the warning through `ActiveReviewGuard.confirmBlocking` (D164); `runBulk` is built on it. The base `BulkDeletePresenter.execute` reports whether the background task started (Q39): the trash action's toast and deselection follow only `true`, and a failed pre-check shows the error toast.
- Restart (8b): the action kind `restart` (label Restart, icon `refresh`) is offered from the server flag `canRestart` in the bar, the drawer and the Content Reviews row; `ReviewActionDialogPresenter` calls `restartStep`, shows the toast "Restarted “{Step}”" and treats `Workflows/Review/TargetSync` as a success with a refresh; `getConflictMessage` has a restart branch for a step someone else already restarted. `isStepRunning(step)` (in review with a non-user owner) drives the running messages and tags and the cancel dialog's running suffix.
- Drawer additions (8b): `getAttempts` and `getAiIssues` build the `Attempts` and `Issues reported by the AI` sections; operators get a "Background task" link per attempt, which opens the task panel (`openStepRun`, `closeStepRun`, `getStepRunPanel`) over `getStepRun` (a row without a value is left out, times through `formatReviewTimeFull`).
- Content reload (8b, D163): `TargetReviewInitParams.contentReloader` (`IReviewContentReloader { reload(): Promise<boolean> }`) is built by the app glue: the CMS reloader `CmsEntryContentReloader` (`[CMS]/presentation/CmsEntryContentReloader.ts`, built in `CmsEntryFormPresenterReviewDecorator` over the undecorated presenter's `loadRevision`, skipped while the form is dirty; the form's loading overlay shows briefly during the reload, accepted, Q40), the WB reloader `WbPageContentReloader` (evicts the page from `FullPageCache`, reads it, applies it with `updateDocument`). `TargetReviewPresenter` calls it once when a non-user step stops being in review and sets `vm.contentNotice`, which the shared `ReviewBar` shows as a success strip inside the bar (`EditorReviewBar` is unchanged).
```

5. Section 5. Append after `The shared field fragments are `[AW]/review/gateway/reviewFields.ts`.` (the end of the first bullet):

```

- Added in 8b: per app `restartCmsEntryReviewStep` and `restartWebsiteBuilderPageReviewStep`, `getCmsEntryReviewStepRun` and `getWebsiteBuilderPageReviewStepRun` (documents in the same folders), and CMS only `listCmsEntryBlockingReviews` (the WB gateway's `listBlockingReviews` returns an empty list, the WB bulk delete runs per item). The fragments `STEP_RUN_INFO_FIELDS` and `BLOCKING_REVIEW_FIELDS` are in `reviewFields.ts`.
```

6. Section 6. Replace ``` `ReviewNotificationHandler` with their content adapter, `ActiveReviewGuard`, ``` with ``` `ReviewNotificationHandler` and `ReviewChangeMessageHandler` subclasses with their content adapter, an `IReviewContentReloader` passed to `TargetReviewPresenter.init` as `contentReloader`, `ActiveReviewGuard` (`run`, `runBulk`, `confirmBlocking`), ```.
7. Section 2, the Tests bullet. Append after `the review core and the app packages are covered, the kept editor code is not.`:

```
 The shared `review/testing` helpers cover the 8b views: `createWorkflowsIdentityContext` (a test identity with teams and permissions), `at` (one clock for the view tests), `createAutomatedStep` and its AI, running and failed builders, `createStepRunInfo` and `createStepRunInfoDto`, and `fakeReviewActivity` (a fake activity bus).
```

8. Section 9. Append after `- The editor has no tests.`:

```
- The role form does not grant `reassign` yet (9c); the admin already reads it (D162).
```

**6b. `api.md`** (a discovery snapshot of 2026-10-01; it is not refreshed, only extended).

1. Replace `Snapshot of 2026-10-01.` (line 3) with `Snapshot of 2026-10-01; sections 1-10 are not refreshed, section 11 lists what phase 8b added (decisions D160-D164 carry the rest).`
2. Append at the end of the file (blank line first):

```markdown

## 11. Phase 8b additions (as built)

- **Change message (D160).** `ReviewWebsocketSender` (`src/features/notifications/ReviewWebsocketSender/`) holds the tenant-scoped, batched send loop that `ReviewNotifierService` used to own (current tenant only, ten recipients at a time, never throws); `ReviewNotifierService` and the new `ReviewChangeNotifierService` both send through it. Four handlers (`Review{Requested,StepStarted,StepApproved,StepRestarted}ChangeNotifications`, `src/features/notifications/handlers/`; a failure sends none, its owner is AI or automation and the requester gets the `failed` notification) send the action `workflows.reviewChanged` (`WORKFLOWS_REVIEW_CHANGED_WEBSOCKET_ACTION`, data `WorkflowReviewChangedWebsocketData`, `src/domain/notifications/`). Recipients come from `getReviewChangeRecipients(review, actor)`: the requester and the current user owner, minus the acting user; `stepApproved` sends only while the review is `inProgress`.
- **Kept run tasks (D161).** `WorkflowStepRunTaskDefinition` has no `selfCleanup`. `DeleteTargetReviewsUseCase` calls `CleanupTaskSubtreeUseCase` for every `taskId` and `runs[].taskId` of every deleted review after its abort; a failing cleanup is logged ("Could not clean up the background task of a deleted review.") and the delete still succeeds. Cancel only aborts.
- **Step run read (D161).** `GetReviewStepRunUseCase` (`src/features/stepRun/GetReviewStepRun/`, internal) returns `ReviewStepRunInfo | null` and fails with `ReviewStepRunNotFoundError` (`Workflows/Review/StepRunNotFound`) for a task that is not the step's current task or one of its `runs`. `canViewStepRunByPermission(viewer)` (`src/domain/review/`) is `editor || reassign`. The type `WorkflowsStepRunInfo` is in `WorkflowsSchemaFactory`; the queries `getCmsEntryReviewStepRun` (`api-headless-cms-workflows`) and `getWebsiteBuilderPageReviewStepRun` (`api-website-builder-workflows`) wrap the engine behind the apps' guards.
- **Blocking reviews (D164).** `listCmsEntryBlockingReviews(modelId, entryIds)` (`api-headless-cms-workflows`, `ListCmsEntryBlockingReviewsUseCase`): at most `BLOCKING_REVIEWS_MAX_IDS` (200) ids, batches of `BLOCKING_REVIEWS_CONCURRENCY` (10), only reviews `inProgress` of entries the viewer can read (`CmsEntryAccess.canRead`), the shared type `WorkflowsBlockingReview`.
```

**6c. `notifications.md`.**

1. In section 8, replace `Nothing is sent for requested, an intermediate approve, a pool start or a restart.` with `No `workflows.notification` is sent for requested, an intermediate approve, a pool start or a restart (the silent change message below covers them).`
2. Append after the paragraph that ends `ten recipients at a time (R188, D149).` (the websocket paragraph of section 8), blank line first:

```markdown

**The change message (D160, R253-R255).** Separate from notifications: `workflows.reviewChanged` is a second websocket action with no title, no body and no toast, so no transport sees it. The data keys of `WorkflowReviewChangedWebsocketData` (`domain/notifications/types.ts`) are `kind` (`requested`, `stepStarted`, `stepApproved` or `stepRestarted`), `reviewId`, `stepId` (null when the change belongs to no step), `namespace`, `targetId` and `targetRevisionId`. One handler per event (`Review<Event>ChangeNotifications`) sends it through `ReviewChangeNotifierService`; the `stepApproved` handler sends only while the review is still `inProgress`, because the final approval sends `approved`. The recipients (`getReviewChangeRecipients`) are the requester and the current user owner, de-duplicated, never the acting user. A failure sends no change message: its owner is AI or automation, and the requester gets the `failed` notification. There is no pool lookup. Delivery is the same tenant-scoped, ten-at-a-time, never-throwing sender as the notification messages (`ReviewWebsocketSender`). The admin refetches what shows that review.
```

2b. In section 1 (line 7), replace `a websocket message, always, and the transports` with `a `workflows.notification` websocket message, always (the silent `workflows.reviewChanged` of section 8 is separate), and the transports`.
3. In section 9, replace `decisions D44, D60, D96, D103, D111, D129 and D149-D156;` with `decisions D44, D60, D96, D103, D111, D129, D149-D156 and D160;`.

**6d. `integrations.md`.**

1. In `### api-headless-cms-workflows` append after the `- Utils: `utils/appName.ts:6-16`` bullet (the last bullet of that section):

```
- Phase 8b wrappers (`src/features/wrappers/`): `GetCmsEntryReviewStepRun` (query `getCmsEntryReviewStepRun`, guard, then `editor` or `reassign`, D161) and `ListCmsEntryBlockingReviews` (query `listCmsEntryBlockingReviews`, D164).
```

2. In `### api-website-builder-workflows` append after the `- Utils: `WB_PAGE_APP = "wb.page"`` bullet:

```
- Phase 8b wrapper: `GetWebsiteBuilderPageReviewStepRun` (query `getWebsiteBuilderPageReviewStepRun`, guard `WbPageReviewGuardService`, then `editor` or `reassign`, D161).
```

3. In `### app-headless-cms-workflows`: replace ``` and the `CmsReviewNotificationHandler`. ``` (end of the `CmsReviewFeature` bullet) with ``` the `CmsReviewNotificationHandler` and the `CmsReviewChangeMessageHandler` (subclass of the shared `ReviewChangeMessageHandler`, D160). ```; replace ``` `CmsEntryFormPresenterReviewDecorator`; components ``` with ``` `CmsEntryFormPresenterReviewDecorator` (which also builds the `CmsEntryContentReloader` over the undecorated presenter's `loadRevision`, D163); components ```; replace ``` the bulk delete presenter through the shared `ActiveReviewGuard` (D157). ``` with ``` the bulk delete presenter through the shared `ActiveReviewGuard` (D157); for all loaded rows the decorator pre-checks with `listBlockingReviews` per chunk of 200 ids and `confirmBlocking` (D164). ```.
4. In `### app-website-builder-workflows`: replace ``` the `WbReviewNotificationHandler`. ``` with ``` the `WbReviewNotificationHandler` and the `WbReviewChangeMessageHandler` (D160). ```; replace ``` `PageReviewBar` and `PageReadOnlySync` (the read-only flag and its reason) ``` with ``` `PageReviewBar` (which passes the `WbPageContentReloader` of `features/editorReview/` as the init params' `contentReloader`, D163) and `PageReadOnlySync` (the read-only flag and its reason) ```.
5. Section 5. Append after the bullet that starts `- Pages and entries lists:`:

```
- Live change and reload (8b): each app subclasses the shared `ReviewChangeMessageHandler` (the silent `workflows.reviewChanged`, D160) and gives its editor an `IReviewContentReloader` (`contentReloader` of the init params, D163): the CMS one lives in the form presenter decorator, the WB one is `WbPageContentReloader`. See `app.md` sections 2 and 4.
```

(verify every old text with `grep -cF`; if a package bullet changed wording in Tasks 17-19, edit that bullet instead and keep the sentence true.)

**6e. `ai-tools.md`** (line 224). Replace `The step run task cleans itself up after it finishes (R179), and every outcome is already on the step.` with `The step run task is kept after it finishes and is deleted with its review (R256, D161), so an operator can read its status in the admin; every outcome is also on the step.`

**6f. `README.md`.** Replace `` - `app.md`: `app-workflows` as built in phase 8a (shared review core, per-app gateways and glue, review flows, GraphQL usage), the workflow editor notes and the open editor bugs. `` with `` - `app.md`: `app-workflows` as built in phases 8a and 8b (shared review core, per-app gateways and glue, review flows, restart, live change messages, GraphQL usage), the workflow editor notes and the open editor bugs. `` and `` - `notifications.md`: developer guide for notifications (what is sent to whom, `` with `` - `notifications.md`: developer guide for notifications (what is sent to whom, the silent change message, ``.

- [ ] **Step 7: Final greps (the proof)**

```
grep -rnE "SEC-[0-9]+" docs/.bruno/workflows docs/.bruno/specs docs/.bruno/plans/2026-10-05-workflows-refactor-roadmap.md ai-context --include='*.md' --exclude-dir=design
grep -rnE "cleans itself up|self-cleans|selfCleanup: \"always\"" docs/.bruno/workflows docs/.bruno/specs/2026-10-05-workflows-refactor-design.md --exclude-dir=design | cut -c1-90
grep -rnE "Background Tasks admin" docs/.bruno/workflows docs/.bruno/specs/2026-10-05-workflows-refactor-design.md docs/.bruno/specs/2026-10-06-workflows-ui-design-brief.md docs/.bruno/plans/2026-10-05-workflows-refactor-roadmap.md --exclude-dir=design | cut -c1-90
grep -rnE "arrives? with 8b|for 8b\)|8a hands over|has no pre-warning|\"all selected\" content runs" docs/.bruno/workflows docs/.bruno/specs/2026-10-05-workflows-refactor-design.md docs/.bruno/plans/2026-10-05-workflows-refactor-roadmap.md --exclude-dir=design | cut -c1-90
grep -n "^## D16[0-4]\." docs/.bruno/workflows/decisions.md
grep -n "D160\|D161\|D164" docs/.bruno/workflows/decisions.md | cut -c1-70
grep -n "D1-D164" docs/.bruno/specs/2026-10-05-workflows-refactor-design.md docs/.bruno/plans/2026-10-05-workflows-refactor-roadmap.md | cut -c1-70
grep -c "WorkflowsSecurityPermissionAccessLevel" docs/.bruno/workflows/app.md
awk -F'|' '/^\| 8[ab]\./ {print NF}' docs/.bruno/plans/2026-10-05-workflows-refactor-roadmap.md
yarn format:check 2>&1 | tail -5
```

Expected: the first grep prints nothing; the second prints only `decisions.md` line 799 (D140, history, followed by the note `_Refined by D161`); the third prints only `decisions.md:520` (D90, history, followed by the superseded note); the fourth prints only `decisions.md:927` (D157, history, followed by the `_Refined by D164` note); the fifth prints the five headings D160-D164; the sixth prints the new headings, the D60, D90, D140 and D157 notes and the D161 mentions; the seventh shows both files; the eighth prints `1` (the one mention is the 8b permissions bullet of `app.md`, which says the enum is gone; any other count is wrong); the ninth prints the same number twice; `yarn format:check` is clean for the touched files. A hit in the second to fourth greps outside the lines named is rewritten, not filtered.

- [ ] **Step 8: Format, pre-commit chain and commit**

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

`git status --short` must list only the docs files of this task (decisions, spec, design brief, roadmap, `app.md`, `api.md`, `notifications.md`, `integrations.md`, `ai-tools.md`, `README.md`) and no `docs/.reports`, `.superpowers`, `docs/.bruno/workflows/design/` or `.gitleaks.toml` entry. Then:

```
git commit -m "docs(workflows): record phase 8b (D160-D164), spec 7.4 and 10-13 and the guides as built" -m "Adds D160 (silent review change message), D161 (run tasks kept and read by workflows), D162 (client gates mirror the workflows permissions), D163 (content reload after an automated step) and D164 (pre-check before the CMS bulk trash), adds notes to D60, D90, D140 and D157, updates spec 5.1, 7.4, 10, 11, 12, 13.1, 13.4, 13.5 and 13.8, marks roadmap row 8b built, refreshes app.md, integrations.md, notifications.md and ai-tools.md and extends api.md for the as-built phase 8b code." -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>" -m "Claude-Session: <CURRENT_SESSION_URL>"
```

If any step of the chain fails and you fix something, rerun the chain from the first line.

**Contract notes:**
1. The contract's Task 20 entry names `decisions.md`, the spec (5.1, 12, 13.4, 13.5), the roadmap row, `app.md`, `api.md`, `notifications.md` and "the developer guides that mention self-cleaning run tasks or the Background Tasks link". The grep found `ai-tools.md` (line 224, the cleanup sentence) and the UI design brief (line 271, the Background Tasks admin link); both are edited. `automations.md` and `infrastructure.md` mention background tasks only generically (`infrastructure.md` lists `selfCleanup` as a platform field), so they stay. Spec 7.4 (two self-cleanup sentences), 10, 11, 13.1 and 13.8 are touched in addition to the contract list because they state the old behaviour or the old gap.
2. `api.md` and the API sections of `integrations.md` are 2026-10-01 snapshots; they are extended (a new section 11, two bullets), not refreshed, as in phase 8a.
3. D160-D164 are the contract's text plus the detail of R253-R255, R256-R258, R259, R262 and R265; the as-built details are checked by Step 2. D161 says the cleanup runs "after its abort" in `DeleteTargetReviewsUseCase` (R256); if Task 3 placed the call differently, Step 2's grep shows it and the sentence is corrected.
4. The restart dialog's derived text (`Last attempt failed. Restarting runs the step again from the beginning.`, R266) is not repeated in the docs; the spec says "says when the last attempt failed and why".
5. The handoff file is not part of this task (the contract lists none); the user decides at the end of the phase.
