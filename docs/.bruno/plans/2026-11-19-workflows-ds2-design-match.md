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

## Update, 2026-11-19: decisions and answers

Batch A is done (`d6e1c97fbf`, `be753a3da9`), deployed to dev.

The user answered the product questions, and `project/notes/answers.md` in the canvas (version
`1795101692-d52b`) answers the 37 code-side questions. Those answers were written by Claude
(Cowork) from the canvas markup, not by the designer: PROPOSED items are built unless the designer
objects, OPEN items keep the interim behaviour. Item numbers below are from that file.

The design system in the canvas (`project/ds/webiny/components/bundle.js`) is ahead of
`packages/admin-ui`. DS 2.0 does not exist in code and porting it is ours. The "Needs a component"
list above is therefore a porting list, not a list of questions.

Settled, no work: per-app pages (7), navigation (36), models list in the editor (19), reorder
controls (20, interim), role group layout (30, interim), role notes (31), no per-event toast
icons (32, interim), model delete unblocked dialog (37), Load more (3), no row selection (4).

### Batch B1: admin only, no API change

Review bar and dialogs (`app-workflows/src/review`):

- Website Builder uses the CMS lock copy again; the per-app lock texts from Batch A are removed.
  No read-only alert in the page editor in any state (12).
- Review state tag: shown only on a finished review. "Approved" (success), "Rejected"
  (destructive). No "Review:" prefix. While in progress only the step tag shows (13).
- A finished review shows no step line, step tag or owner, in both apps (11).
- Cancel review and Reassign move into a "More review actions" overflow menu on the bar (8).
  The Review details footer mirrors the bar, with the same overflow (17).
- The progress popover is removed; the text stays next to the bar (10).
- Reject dialog button is primary (user decision).
- Start keeps its confirmation in both places (9): no change.
- Nobody-eligible warning: "Nobody in {team} other than you can review this step. Ask a workflow
  manager to add reviewers." (14).
- A step that is failed now: a destructive alert at the top of Review details, "Failed at
  {time}: {reason}"; Attempts stays as history (16).

Workflow editor (`app-workflows/src/editor`):

- The more-actions menu in the header is removed; Delete workflow is its own button (22).
- A rule's field error replaces its warning; never both (23).
- Rules empty state: "No routing rules. {Strategy} assigns every review on this step." and, for
  None, "No routing rules. Every review waits in the team pool.", with an Add rule button (24).

Reviewer exclusions (`app-workflows/src/settings`):

- "Search by name" replaces the "All users" filter (26).
- Empty states: Expired "No expired exclusions"; a search with no match "No one matches
  “{query}”" with a Clear search button (29).

Review list (`reviewList/`): filtered-empty text per app, CMS "Try another title, content model
or state, or clear the filters.", Website Builder "Try another title or state, or clear the
filters." (6).

### Batch B2: needs API or data changes

- List controls (1, 2): scope Assigned to me · Team pool · Team in review · Requested by me ·
  All, and state All · In review · Failed · Approved · Rejected. Today the API has five list
  kinds and a state filter only for My requests; an "All" scope and a state filter on every scope
  are new.
- Sortable Name column (user decision): the API sorts by last change only.
- Content model filter inside a Filter button, CMS only (5, 6); model filter All / With workflow
  / Without workflow and the item menu in the editor (22).
- Cancelled review in the drawer: "This review was cancelled by {name} on {date}." with the
  steps read-only below (18). Needs who cancelled and when.
- Exclusions: teams per user, comma-joined (27). Needs team data per user.
- Automation step: its one key setting as a row (25). Needs a field in the automation catalogue.
- Pool message names the recipient's own team or teams (33): the text differs per recipient
  group, so the batch is split by team set.
- "View review details" links open the content with the drawer open (34). Needs a deep link.
- E-mail: generic greeting and footer plus the details table (35). The user has yet to confirm.

### Batch C: admin-ui DS 2.0 port

`WorkflowStatus`, `Pagination`, `ButtonGroup`, `Table` sort and selection, `Switch variant` and
`inline`, `Alert size`, `RadioGroup inline`, `Accordion spacing`, `ProgressBar trailing`,
`Toast status`, `Drawer headerExtra` and `footerStart`. Additive only: no changed defaults.

All batches go into this branch and PR #6223 (user, 2026-11-19): no separate PR and no separate
plan file. B2 and C are detailed in this file before they start.

## Batch B2 design, 2026-11-20

Designed by a read-only architect pass against the code; the claims below carry its `file:line`
references and are checked again as each lane is built. E-mail (10) is confirmed by the user:
generic greeting and footer, details table, one batched send.

Reverses or refines: D112 (no Failed steps tab), D94/R91 (state filter on every scope), D119
(default sort), parts of D155 (team names, review-details link, detail card, model name), D170 and
D180 (team names for listed users), D116 (model filter is a server parameter).

### 1. Content Reviews list: scope and state

Engine (`api-workflows`), one type per file in `domain/review/`:

- `ReviewListScope = "assignedToMe" | "pool" | "teamInReview" | "myRequests" | "all"` replaces
  `ReviewListKind`.
- `ReviewListState = "all" | "inReview" | "failed" | "approved" | "rejected"`.
- `ReviewListWhere` is `{ titleContains?, state? }`; `reviewState` and `stepState` go.

Scope is "who", state is "where"; each is one pure predicate, combined with AND, used for the
storage where (`ListReviews/createReviewListWhere.ts`) and the code check
(`domain/review/matchesReviewList.ts`).

| Scope | Predicate |
|---|---|
| assignedToMe | `currentOwnerId = me` |
| pool | `currentStepState = awaiting`, my teams ∩ `currentCandidateTeamIds`, requester ≠ me |
| teamInReview | `currentOwnerId` set and ≠ me, my teams ∩ candidates |
| myRequests | `requester.id = me` |
| all | none beyond the read filter |

| State | Predicate |
|---|---|
| all | none |
| inReview | `state = inProgress`, `currentStepState ≠ failed` |
| failed | `state = inProgress`, `currentStepState = failed` |
| approved | `state = approved` |
| rejected | `state = rejected` |

Empty by definition, answered without a query (`domain/review/isEmptyReviewListFilter.ts`, mirrored
in the admin): pool × failed, approved, rejected; assignedToMe × failed; teamInReview × failed.

"All" is built as every review the viewer can read, limited to viewers with `reassign` or full
access, so All × Failed is today's operators' Failed steps view. Its final meaning is with the
designer; opening it to everyone is one line in each app wrapper.

Repository: `currentStepState_not` and `currentOwnerId_not: null` on `ReviewRepositoryListWhere`.

GraphQL (breaking, `next` is unreleased): `WorkflowsReviewListScope`, `WorkflowsReviewListState`;
`listCmsEntryReviews(scope!, where { modelId, titleContains, state }, sort, limit, after)`, same for
Website Builder; `WorkflowsReviewListKind` is deleted. The app wrappers replace the `failedSteps`
gate with the `all` gate.

Default sort: oldest change first for assignedToMe, pool, teamInReview and all with state inReview
or failed; newest first otherwise.

Admin (`app-workflows/src/review/presentation/reviewList/`): two `SegmentedControl`s replace the
tabs; presenter state `_state`; route params `scope` and `state` replace `tab`, an invalid or
unavailable value falls back to the default; the Home widgets' "View all" links carry both.
Default state: In review for the queues, All for Requested by me. A scope switch keeps the state
unless the pair is empty by definition.

### 2. Sort by name

- A storage-only `titleSortKey` on the review model, written by `ReviewEntryMapper.toValues` and
  never mapped out. It is the UTF-8 hex of `title.trim().toLocaleLowerCase()`, capped at 200
  characters: a storage test showed that OpenSearch range filters on a text field compare analysed
  tokens, so a plain lower-case key did not page in sort order there. A hex key is one token and
  orders the same on DynamoDB, SQL and OpenSearch.
- Sort enum gains `title_ASC | title_DESC`; the cursor becomes `{ sort, value, ids }` and is
  refused with another sort; the repository gains `titleSortKey_gte` / `_lte`.
- Verified with a storage test on DynamoDB, SQL and OpenSearch. A review saved before the key
  existed has none until its next save and drops out of title-sorted pages after the first.

### 3. Filters

- Content Reviews: the content type picker moves into a Popover behind a "Filter" button, CMS only.
  Admin only.
- Editor: `listCmsEntryWorkflowModels` gains `hasWorkflow: Boolean`, filtered before paging with
  the one existing workflow list call. Left panel: All / With workflow / Without workflow, and an
  item menu with Create workflow or Delete workflow.

### 4. Cancelled review in the drawer

Admin only: `cancelledBy` and `lastChangedOn` already hold who and when. Text "This review was
cancelled by {name} on {date}."; the steps render read-only below, no footer actions.

### 5. Teams of listed users

Field resolver `WorkflowsListedUser.teams`, same body as `WorkflowsStepCandidate.teams` (per-request
loader, one team list call per request). The exclusions table and picker join the names with ", ".

### 6. Automation key setting

`IAutomationDefinition.keySetting?: string`, the name of one top-level property of
`settingsSchema`; passed through as `keySetting: String`. The editor shows that property's title
and value; the `url` special case goes.

### 7. Team names for the nobody-eligible warning

Field resolver `WorkflowsStep.candidateTeams` for review steps, through the same loader. The dialog
reads it from the workflow it already holds.

### 8. Pool message with team names

- `listPool` returns each recipient's teams ∩ the step's candidate teams.
- `ReviewNotifyParams` takes `deliveries: { recipients, message }[]`: one user lookup and one link
  build per call, one transport send per transport and delivery.
- The handler groups recipients by team set (pure `groupPoolRecipients.ts`), joins names with
  `joinTeamNames.ts` ("A", "A and B", "A, B and C"), and sends one delivery per distinct text.

### 9. Review details link

`ReviewTargetLinkService` appends `&reviewId=` when asked; `NotificationMessage.link` is
`"content" | "reviewDetails"`; the previous-owner Reassigned message and the Failed message use
"View review details". Admin: one hook in `review/editor/` reads `reviewId` from the location,
opens the drawer, and removes the param on close.

### 10. E-mail layout

Transport message gains optional `details` (content type, content title, step number and count,
step title, requester). `contentTypeName` is snapshotted into the target context at request time
(CMS: model name; Website Builder: "Page"). `MailNotificationTransport` renders greeting, body,
details table, button and footer, every value escaped; still one send per bcc chunk.

### Build order

Wave 1, in parallel: (A) 1 + 2; (B) 4; (C) 3 editor part; (D) 9, then 8, then 10.
Wave 2: (E) 5, 6, 7 in `WorkflowsSchemaFactory.ts`; the Filter button of 3.

### Open, with the designer

Meaning and audience of "All"; whether Assigned to me × Approved means "held the final step";
how empty-by-definition pairs look; default state per scope; wording for several teams in the pool
message; the e-mail footer for requesters and previous owners; the tag of the step that was current
when a review was cancelled.

Wave 1 is built (items 1, 2, 3 editor part, 4, 8, 9, 10). Choices made while building, to confirm
with the designer: Team pool always sorts oldest first; the default state of All is All; a scope or
state change resets the sort, the search and the content type; state Failed is not limited to AI
and automation steps; the Cancelled and Taken over e-mails use the previous-owner footer.

## Batch C design, 2026-11-20: admin-ui additions

Designed by a read-only architect pass over the canvas library (`bundle.js`) and `packages/admin-ui`;
visual values then taken from the canvas `bundle.css` and `tokens.css`. Of the fifteen gaps, six
need something new in admin-ui. All six are additive: no default changes and no markup change for
existing usages.

### Add to admin-ui

| Addition | Detail, with the value from the canvas CSS |
|---|---|
| `Tag` variant `warning-light` | Background warning-subtle (the canvas uses its lightest warning tone), hover warning-muted; same pattern as `success-light`. |
| `Alert` prop `size`, `"md"` (default) or `"sm"` | `sm`: padding xs-plus on top, right and bottom, sm-extra on the left; small text; 16px icon. |
| `Switch` prop `variant`, `"default"` or `"branded"` | `branded`: checked track is primary (the default stays secondary), focus ring to match. |
| `RadioGroup`: forward `orientation`; item `description` | Horizontal: a wrapping row with a large column gap. Description: 12px / 16px, muted, under the label. |
| `Drawer` prop `headerExtra` | A slot under the title and description, above the body; with it the body has no top border. |
| New `ButtonGroup` | `role="group"` with a label. Props `label`, `variant` (`default` or `ghost`), `kind` (`icon`), `size`, `align`. Gap: ghost none; default xs for small sizes, sm for medium and large; icon groups xs. |

### Not ported, and what the workflows UI does instead

- `WorkflowStatus`: built in `app-workflows` from two `Tag`s (step with swatch, 100px wide and
  truncated; state), since its statuses are workflow terms.
- `Table` sort and selection: the review list uses `DataTable`, which already sorts and has column
  visibility. Selection is dropped (answer 4).
- `Pagination`: Load more stays (answer 3).
- `Accordion spacing`: `variant="container"` already has that gap.
- `ProgressBar trailing`: `valuePosition="end"` with `getValueLabel`.
- `Switch inline`: `SwitchPrimitive` with a label is that layout.
- `Drawer footerStart`: the existing `info` prop.
- `Toast status`: the existing icon slot and `show*` helpers; per-event icons wait on answer 32.
- Muted text: the class `text-neutral-strong`, which is the canvas token (neutral-700).
- `DateInput`: `DatePicker` with a placeholder.
- `neutral-outline`: admin-ui's `neutral-base-outline` (same fill and border in the canvas CSS).
- `ListView`: needs the app-admin list presenter; the review list keeps its own view.
  `SplitView` and `SimpleForm` from app-admin are used for the workflow editor layout.

### Lanes

A. admin-ui controls: `Switch` variant; `RadioGroup` orientation and item description.
B. admin-ui display: `Tag` `warning-light`; `Alert` `size`.
C. admin-ui structure: `ButtonGroup`; `Drawer` `headerExtra`.
D. app-workflows, after A to C: `WorkflowStatus` and the review list on `DataTable`; the progress
   label; Awaiting tag `warning-light`; the Rejected step tag in red, as the review tag; small
   alerts; `ButtonGroup` on rule actions; inline radios in the request dialog and described
   strategy radios; the branded requester-pick switch; the editor on `SplitView`; muted text.
   The step drawer's tabs in `headerExtra` need the form's tab list rendered outside the body and
   are done last.

### Open

`DataTable`'s sort header is a clickable `div` with no keyboard access and no `aria-sort`. The
review list's own header is a button today. Fixing `DataTable` changes markup for every list that
uses it; using it as is loses keyboard sorting on the review list.

Decided (user, 2026-11-20): the review list moves onto `DataTable` as it is. Keyboard sorting on
that list is lost until `DataTable`'s sort header becomes a button; `DataTable` is not changed here.

Step creation, 2026-11-20: the add-after button sits outside each step card, the drawer title has no
icon, one separator sits between the requester-pick switch and the routing rules, and a rule is a
plain section with an all-caps label and grouped actions. Still different from the canvas:

- The rule summary is plain text. The canvas puts it in a neutral rounded box; admin-ui has no
  such box without alert semantics (`Alert` announces itself and compiles markdown, `Card` has no
  neutral fill).
- The step drawer's tabs are in its body. Pinning them in the header needs the form to render a
  tab list and its panels separately.
- The canvas draws only the People step's Assignment tab. The General and Test routing tabs and
  the AI and Automation drawers have no design; the Colour field is a radio list.
- Review list on `DataTable`: hidden columns are not remembered after leaving the page.

## Visual pass, 2026-11-20

Until now the design was compared as markup. The artboards are now rendered locally and compared
with screenshots of the dev admin at the same viewport, one agent per group of screens. Screenshots:
session scratchpad `shots/{reviews,bar,settings,editor}/`. The canvas also gained step reordering
in `Workflow-Editor` (drag handle left of each card, number tag, Move up / Move down / Delete
grouped in the header), which settles answer 20.

Every fix below uses admin-ui components and props only. A recurring cause: the design uses the
small control size (32px fields and buttons, 48px table rows), the live screens the default size.

### V1. Review bar and Review details

- The bar sits inside the form column, as wide as the form card and lined up with it, not in a
  full-width band; no drop shadow.
- The step line is a neutral pill with the colour square (bar and Website Builder strip).
- Review details: each step is a rounded neutral card with its rows as white sub-cards; row labels
  regular weight; step titles in the normal text colour.
- Reject counter left-aligned; small buttons and fields.

### V2. Content Reviews list, Home widgets, pickers

- Toolbar: the search row first; under it one neutral band with the state control at the left and
  the scope control at the right.
- Column order: Name, Content type, Requested by, Modified, Workflow. Workflow is a compact last
  column; the sort arrow sits next to its label.
- Content type is one line, so rows are the compact height. Title without the icon, design size.
  Search placeholder "Search...". "Clear filters" is a primary button.
- Home widgets: flat card without shadow, regular-weight row titles, inset colour bar. The pair
  per app side by side if the dashboard grid allows it.
- Pickers: small field height; the same option row (no avatar, no person icon) in every picker.

### V3. Reviewer exclusions and role permissions

- Page title at the design size; "Add exclusion" in the toolbar row at the right; borderless
  search; the segmented control on its own neutral band; table without an outer box.
- The team line under the user name in the table.
- Dialog: Reason helper text under the label, two-row field, filled neutral Cancel, small fields.
- No "Add exclusion" button inside the empty state.
- Role permissions: choosing Custom ticks only "Manage workflows".

### V4. Workflow editor and step drawer

- Step card header as the new artboard: drag handle outside at the left, number tag, grouped
  Move up / Move down / Delete, no edit button and no summary line. Card hugs its content.
- Title in the normal text colour, level with the description.
- Expanded step: label and value in two aligned columns, small text, muted label; "Edit step"
  with its pencil icon.
- Drawer: label, then description, then the switch; rule label strong; "Routing rules" strong;
  "Add rule" a filled neutral button; selects without the leading search icon; the summary line in
  a neutral box (needs a component: see below).

### Needs a decision or the designer

- Step drawer: the live "Check this step" panel above the tabs repeats the inline field errors;
  the design shows only inline errors.
- Role permissions: card with the access control in its header and always open (answer 30, open).
- Toasts: the design's white card against the base admin's dark toast.
- General tab: the Colour field as a ten-row radio list; no design.
- A neutral box without alert semantics does not exist in admin-ui (rule summary).

### To check

- Model delete: the "a workflow blocks this" alert was not reached; it appears only after the
  delete is attempted and refused. Verify from code and a test, not by deleting.
- Escape did not close dialogs or the Filter popover for two agents, who suspect the automation
  tool; dialogs open with a focus ring on the close button.

## Visual pass 4 and designer questions, 2026-11-20

Pass 4 compared every screen again after `ad3d2c299a`. Fixed from it: the "In review" tag on an open
review (bar and details drawer) and a drop indicator for step drag. User (2026-11-20): every open
question goes to the designer; the admin keeps what it does today until answered.

Questions from the code side on "Publishing Workflows — Webiny DS 2.0". Until answered, the admin keeps what it does today (stated per item).

Entry Review / Website Builder Review
1. Request review dialog: the hint "Picks are checked again when the step is reached…" is drawn only under "Choose a person". Should it also show under "Automatic"? Today: shown in both.
2. Website Builder Review: the grey banner "This page is in review, so it can't be edited." repeats the strip's line "Editing, publishing and moving are locked while this revision is in review." Keep both, or only one? Today: no banner.
3. Review bar and Review details footer: Cancel review and Reassign are not drawn. Today they sit in a kebab menu left of Reject / Approve (and left of Take over). Is that the right place?
4. The bar shows "In review" twice for an open review (yellow review tag, then the step tag). Intended? Today: built as drawn.
5. Tags: the list and widgets are drawn with text-only soft tags; the bar draws tags with icons, and Rejected is solid red. Which is right for the list and the Home widgets? Today: icons everywhere, solid red Rejected.

Content Reviews list (Main)
6. Column header "Content model": the same list exists for Website Builder, where rows are pages. One wording for both apps ("Content type"?), or per app? Today: "Content type" in Headless CMS, no column in Website Builder, and the empty state says "content model".
7. Scope "All": who may see it, and what does it mean for someone who is not an admin?
8. Scope × state pairs that are empty by definition (Team pool × Approved / Rejected / Failed, Assigned to me × Failed, Team in review × Failed): hide the state, disable it, or show an empty state? Today: disabled.
9. Does "Assigned to me × Approved" mean "I held the final step"?
10. Default state per scope. Today: In review for the queues, All for Requested by me and for All.
11. Should a scope or state change reset the sort, the search and the content type filter? Today: yes. Team pool always sorts oldest first.
12. Is "Failed" limited to AI and automation steps? Today: any failed step.
13. Toolbar: the icon buttons (filter, refresh, columns) have no drawn behaviour. Today: a text "Filter" button with a content type select, no refresh button. What opens from each icon?
14. Row checkboxes and "select all": what bulk actions do they serve? Today: no checkboxes.
15. Footer: "Showing 10 of 10" needs a total; the API pages by cursor. Is "Showing N reviews" plus "Load more" acceptable?
16. Row menu: item labels look right-aligned in the artboard. Intended? "Reassign" is not listed; should it be there?
17. Empty states "Nothing assigned to you" and "You are not in a reviewing team" have no artboard.

Workflow editor / Step drawer
18. Header kebab "More workflow actions": what does it contain? Today: only delete and Save.
19. Left panel lists workflows in the design; the admin lists content models (one workflow per model) with a filter All / With / Without. Acceptable?
20. Workflow title: the editable title of the design system is orange and indented. Should it be dark like a page title?
21. Step drawer tabs are drawn in the drawer header. Today they are under the header divider. Is the header position required?
22. Only the People step's Assignment tab is drawn. Needed: General tab (the Colour field is a ten-row radio list today), Test routing tab, the AI step form, the Automation step form, and the empty state of Routing rules.
23. The live "Check this step" panel above the tabs lists all problems of the step and repeats the inline field errors. Keep, or inline errors only?
24. Rule summary: drawn as a neutral rounded box. Is it a new component (an Alert has alert semantics)?
25. Drag to reorder: no drop state is drawn. Today: the dragged step dims to 40 % and a 2px primary line shows on the edge where it lands. Acceptable?

Reviewer exclusions
26. "Until" field: drawn 146px wide with placeholder "DD/MM/YYYY". The date picker of the admin is wider and says "Pick a date". Is the drawn size required?
27. The empty state ("No exclusions") and the table's expired rows: no artboard for the empty state.
28. Add exclusion: should a team be selectable, or only a person? Today: person only.

Home widgets
29. The widgets are drawn in a row. The dashboard has only a left and a right column, so they stack on the right. Acceptable? Rows are drawn without dividers and two per widget; today five rows with dividers and "View all".
30. One pair of widgets per app (Headless CMS, Website Builder), four in total: intended?
31. Empty state of "For me to review": no artboard.

Role permissions
32. The access control is drawn at the right of the card header, card always open. The admin's permission sections are accordions with the control under a label. Is the drawn layout required?

Notifications
33. Toasts are drawn as white cards; the admin's toast is dark. Change the base toast, or keep it?
34. Pool message for several teams: wording ("Legal, Editors and 2 more"?).
35. E-mail footer for requesters and previous owners; the Cancelled and Taken over e-mails use the previous-owner footer today.
36. Review details of a cancelled review: which tag does the step that was current at cancel time get?

## Designer answers, batch 2 (B1–B36), 2026-11-20

Answers are in the canvas file `project/notes/answers.md` under "Batch 2". Built: B1, B4, B5, B6, B7,
B8, B9, B11, B13, B17, B23, B27, B31, B34, B35 (commits `8bcd3cdf8f`, `6cab619db9`, `ef77704892`).
B36 was already right. No change needed: B2, B3, B10, B12, B14, B15, B16, B18, B19, B21, B24, B25,
B26, B28, B29, B32, B33. B20 (dark title) is the design system's `EditableTitle`, left. B22 (General,
Test routing, AI and Automation forms, empty rules state) stays open with the designer.

Not built:

- B30, "a widget pair only for an app with at least one workflow": dashboard widgets mounted after
  the first render are not registered (`Compose` in `packages/react-composition`). The access part
  is built (Website Builder needs page read access). Needs a decision: fix `Compose`, or keep the
  pair registered and render nothing.
- B9 counts only the last owner of each step; a person reassigned away before the step finished is
  not counted. Counting them needs a new stored field and a backfill.

Side effects to confirm: step-level warnings that mark no form field show only on the step card,
not in the drawer (B23); the tooltip of a disabled state is mouse-only (B8).
