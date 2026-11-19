# Workflows: match the admin to the DS 2.0 canvas

Date: 2026-11-19. Branch: `bruno/fix/next/workflows-2026-11-12` (PR #6223).

Source: the Claude Design canvas "Publishing Workflows — Webiny DS 2.0"
(`https://claude.ai/artifact/EwByMKARyGU9AeTEy5zNxZ`, version `1795093759-d72d`), 14 artboards.
The artboards were read as markup and script, not rendered. Four read-only agents compared them
with the code; their reports are the input to this plan and are not yet verified line by line.

The canvas is newer than `docs/.bruno/workflows/decisions.md` and reverses several recorded
decisions. Those items are not in Batch A. They are listed under "Needs a decision".

## Batch A: fix now

Clear mismatches that no recorded decision covers and that existing admin-ui components can do.
Mostly copy. Each area is one implementer; tests are run afterwards, one command at a time.

### A1. Review bar, dialogs, toasts, review list, review details (`app-workflows/src/review`)

Review bar messages (`targetReview/getReviewMessage.ts`, `getStepRunMessage.ts`):

- No review: "This content needs a review before it can be published."
- Add the full stop: "Waiting in the {team} team pool.", "You are reviewing this step.",
  "{owner} is reviewing this step.", "{step} is running."
- Approved: "Every step approved. Ready to publish."
- Rejected lock text: "This revision is locked. Create a new revision to fix it, then request a
  new review."

Step tags (`getStepStateTag.ts`, `reviewBarAppearance.ts`): Awaiting gets the `hourglass_empty`
icon, In review gets `rate_review`, Failed uses `destructive-light`.

Button emphasis (`getReviewActions.ts`): Reject and Restart are `secondary`.

Dialogs (`actionDialog/`):

- Approve: title `Approve “{step}”?`, dialog description "The review moves on to the next step.",
  field label "Comment" with description "(optional)", placeholder "Anything the author should
  know", no note, Approve button has the `check` icon.
- Reject: title `Reject “{step}”?`, body "Rejection is final for this revision. The author
  creates a new revision to fix it and requests a new review.", field label "Reason", no
  placeholder, the note is the counter only, error "Use at least 10 characters.". The button
  variant stays as it is (see "Needs a decision").
- Take over: body "{owner} is reviewing “{step}”. If you take over, you become the owner and
  {first name} no longer reviews it."
- Cancel buttons in these dialogs are `secondary`.
- Restart: "…Restarting runs the step again from the start."
- Cancel review: title "Cancel this review?", body "Review progress on “{title}” is lost and
  editing is unlocked for the requester."
- Reassign: body "Choose who reviews this step on “{title}”.", visible required label "New
  owner", placeholder "Search people".

Toasts (`review/toasts/getReviewToastText.ts`): take over without notify gets "You’re now the
owner of this step."; cancel gets "Editing is unlocked for the requester.".

Review list (`reviewList/`): filtered-empty description "Try another title, content type or
state, or clear the filters."; load error description "The server did not respond. Try again in
a moment."; row actions Start, Take over, Restart and Open in new window move into the one row
menu, in the design's order and with its icons.

Review details (`reviewDetails/`): "Requested by {name}", "Requested today at {time}"; the AI
issue Info tag is `neutral-light`; the attempt link is a plain "Background task" link.

Website Builder strip: its own lock texts, "Editing and publishing are locked while this
revision is in review." and "Editing is locked. Create a new revision to make changes.".

Request review dialog: reviewer picker placeholder "Search people".

### A2. Workflow editor (`app-workflows/src/editor`, model delete in `app-headless-cms-workflows`)

- Step type descriptions: People "Members of the reviewing teams approve or reject the
  revision.", Automation "Runs an automation, e.g. sends a webhook.", AI "An AI model checks the
  content and approves or rejects it."
- Requester-pick hint: "The requester can choose a reviewer when they request a review. Picks are
  checked again when the step is reached."
- Rule fields: "Include subfolders" is a Switch; the target field has no helper text; rule
  warnings start with "Rule {n}: ".
- Step drawer: the subtitle goes in the Drawer `description` (below the title), with a
  typographic apostrophe.
- Editor header: description "Applies to {model} ({app}) · Created by {name} on {dd.mm.yyyy}";
  a visible "Delete workflow" icon button; Save has no icon.
- The line "Changes apply to new review requests; reviews already running are not affected."
  moves below the add button.
- Heading "Workflow steps" above the steps.
- A "+" icon button beside each step, "Add a step after {title}".
- Expanded step: key and value rows (People: Reviewing teams, Assignment; AI: Model, Tools;
  Automation: Automation, URL) and an "Edit step" button.
- Bottom button: "Add new step", secondary, small, centred.
- Left list: an "Unsaved" tag replaces the dot.
- Model delete, blocked: one sentence "{Model} has a workflow. Delete the workflow “{name}”
  first, then delete the model." with the link "Open workflow"; no heading, no icon.

### A3. Settings (`app-workflows/src/settings`, role permissions)

- Exclusions description: "Take people out of automatic assignment for a while, e.g. during
  leave. Automatic assignment skips them and reviewer pickers show them as Unavailable; work they
  already hold stays with them."
- The four-point info card is removed.
- "Add exclusion" button: `plus` icon, small.
- Empty state: `table` type, small, "Everyone in the reviewing teams can be assigned
  automatically."
- Dialog: user placeholder "Search people"; the disabled option note is "Already excluded";
  Reason is a two-row Textarea (max length kept); Clear is always visible.
- Role permissions: control label "Workflows access"; Full access note "People with this role can
  manage workflows, reassign reviewers and operate reviews."; No access note "People with this
  role can’t manage workflows or operate reviews."; typographic apostrophe in the reviewing
  alert.

### A4. Notification copy (`api-workflows/src/domain/notifications/messages`)

- Rejected, in-app: "{decider}: “{comment}”. Create a new revision to fix it."
- Rejected, e-mail: "…Create a new revision, fix it and request a new review."

## Needs a decision

The canvas contradicts a recorded decision, or drops something that works today.

1. Content Reviews list (`Main`): two segmented controls instead of five tabs, one combined
   "Workflow" column, selectable rows, numbered pagination, CMS and Website Builder rows in one
   list. Against D112, D113, D133.
2. Navigation: one "Publishing workflows" group (Content Reviews, Workflows, Reviewer
   exclusions). Against D133, R206, D178.
3. Workflow editor left panel lists workflows, not content models. Against D116, R280.
4. Step reorder: the design has no Move up, Move down or drag handle, and no step numbers.
5. Review state tags: "In review" (warning) and red "Rejected", without the "Review:" prefix.
   Against QBZ-52, D121, Q29/Q30. Also the rejected bar without its step line.
6. Notifications: per-event toast icons, the team name in the pool message, "View review
   details" links, and the designed e-mail (greeting, details table, footer). Against D155; a
   greeting needs one mail per recipient.
7. Actions the design does not draw: Cancel review and Reassign on the bar, the Start confirm
   dialog, the steps popover, the "nobody eligible" alert, the role notes for an empty or full
   Custom selection (QBZ-77), the failed-reason alert in review details.
8. Reject button: primary in the design, destructive today (earlier decision C5).
9. Exclusions toolbar: name search instead of the "All users" filter (R332, R340); sortable user
   column; avatar and team line per user.

## Needs a component (through the designer)

admin-ui has no: `WorkflowStatus`, sortable or selectable `Table`, standalone `Pagination`,
`ButtonGroup`, `Switch variant="branded"`, `Alert size`, a Drawer header slot for tabs, inline
`RadioGroup`, a `Text` colour, a typed date input with a placeholder, `Tag` `warning-light`.

## Verification

Per area: the unit tests of the touched files, by path. Then `yarn build`, deploy `api` and
`admin` to dev, and a click-through of the changed screens.
