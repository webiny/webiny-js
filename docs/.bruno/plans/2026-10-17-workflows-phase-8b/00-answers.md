# Phase 8b — user answers (2026-10-17)

Questions continue the 8a numbering (8a ended at Q31).

- Q32 Live updates: a new silent websocket message `workflows.reviewChanged` (no toast) carries the namespace, review id and target ids. It goes tenant-scoped to the review's participants on the domain events requested, stepStarted, stepApproved (intermediate), stepRestarted and failed. On the client the review bar, the details drawer, the lists and the widgets refetch on it. Viewers who are not participants see changes on reload or after their own action. This is an API change in 8b (R253, R254).
- Q33 Background task: workflows owns reading the step's background task. A workflows use case and a per-app GraphQL query return the task information, so the drawer can show it. User: "whatever is required for some user to determine if something was wrong or ok. we can shape the output data as whatever we like." The run task is kept until its review is deleted (R256-R258).
- Q34 Failed steps tab: the client checks the viewer's `workflows` permission for `reassign` (and full access) and shows the tab only with it. There is no API change (R259).
- Q35 "Content updated by {step}" (QBZ-56): built in 8b. When an AI or automation step finishes while the editor is locked and the revision changed, the editor reloads the revision (CMS entry, WB page) and shows the notice. The icon is `bolt` for automation and `auto_awesome` for AI (R262).
- Q36 Attempts rendering: no question was asked. It follows from D82 and the design README (R261).
- Q37 Copy the design does not provide: accepted as proposed (R264):
  1. Failed with empty reason: bar "{Step} failed.", restart dialog "Last attempt failed at {hh:mm}. Restarting runs the step again from the beginning."
  2. Tag tooltips: running "{Step} is running since {hh:mm}.", failed "{Step} failed. The requester or an operator can restart it."
  3. AI issue severity labels: Error, Warning, Info.
  4. An AI issue without a field: field cell "Whole content". Without a suggestion: cell "—".
  5. Attempt outcomes: Approved, Rejected, Failed, Running.
  6. Task panel: heading "Background task", rows Status, Started, Finished, Iterations, Reason; statuses Pending, Running, Done, Failed, Aborted. When the task is gone: "This task is no longer available."
- Q38 CMS bulk trash of "all selected" (all loaded rows, sent as `where: { id_in }` to a background task that swallows the workflows refusal). The first answer, "pre-check with the list's `where`", rested on a wrong premise; the planner corrected it and the user re-answered: pre-check by ids. A new CMS query `listCmsEntryBlockingReviews(modelId, entryIds)` returns the active reviews of those entries, reusing `toBlockingReview` and the read-access filter of `BlockDeleteMultipleWhileInReview`. Before the bulk task, the workflows decorator calls it, shows the 8a warning, cancels through cancel-for-delete, then runs the bulk task. Large selections keep the background task (R265).
