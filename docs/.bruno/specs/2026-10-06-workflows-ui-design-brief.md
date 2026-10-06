# Workflows UI: design brief

Status: draft, 2026-10-06. Audience: Claude Design, designing with the Webiny admin design system. This brief describes what each screen is for, who uses it, what it shows, what users can do, and every state it must handle. Layout, component choice and visual treatment are the designer's call.

Source of truth for behaviour: `docs/.bruno/specs/2026-10-05-workflows-refactor-design.md` and the decision log `docs/.bruno/workflows/decisions.md` (UI decisions D88-D96).

---

## 1. Context

### 1.1 What workflows are

Advanced Publishing Workflows is an enterprise Webiny feature. An administrator attaches a workflow to a content model (a Headless CMS model, or Website Builder pages). A workflow is an ordered list of steps. Before a revision of that content can be published, someone requests a review, and the revision has to pass every step in order. Each step is done by a human reviewer, an AI, or an automation. When all steps approve, the revision can be published. If any step rejects, the revision is finished: the editor creates a new revision, fixes the issue, and requests a new review.

### 1.2 Who uses it

| Persona | What they do | How often |
|---|---|---|
| Workflow administrator | Builds workflows: steps, reviewer teams, routing rules, automations, AI steps. Manages the tenant's exclusion list. Investigates "why was this assigned to X?". | Occasionally, high stakes |
| Editor (requester) | Writes content, requests a review, optionally picks a reviewer, follows progress, creates a new revision after a rejection. | Daily |
| Reviewer | Gets assigned work or picks it from the team pool, reviews, approves or rejects with a comment, takes over work from a colleague. | Daily |
| Workflow operator (has "reassign") | Moves work between reviewers, restarts failed automated steps, cancels stuck reviews. | Occasionally |

One person can hold several roles. A requester can never review their own content.

### 1.3 Terms (use these words in the UI)

- **Workflow**: the definition (steps) attached to a model.
- **Review**: one run of a workflow on one revision of an entry or page.
- **Step**: one stage of a review.
- **Step types**: **Review** (humans from one or more teams), **Automation** (code-defined, e.g. "Send webhook"), **AI** (an AI model reviews against written instructions).
- **Owner**: who currently holds a step. Shown with an actor type: a person, AI, or automation.
- **Pool**: a step nobody owns yet; any eligible team member can start it.
- **Picked**: the requester chose the reviewer when requesting.
- **Routed**: the system chose the reviewer, by a routing rule or a strategy.
- Avoid the word "manual" for assignment.

### 1.4 States

Step states (all six need a distinct, recognisable treatment):

| State | Meaning |
|---|---|
| Pending | Not reached yet. |
| Awaiting | Reached, in the team pool, nobody started it. |
| In review | Someone (or the AI / automation) is working on it. For AI and automation this reads as "Running". |
| Approved | Passed. |
| Rejected | Failed by decision. Final for this revision. |
| Failed | AI or automation hit a technical error. Can be restarted. |

Review states: **In progress**, **Approved**, **Rejected**, **Cancelled**.

### 1.5 Actions and who sees them

The server computes which actions the current viewer may take; the UI shows only those.

| Action | Who | When |
|---|---|---|
| Request review | Anyone who can edit the content | Revision has no active review and its model has a workflow |
| Start | Member of the step's teams, not the requester | Step is Awaiting |
| Take over | Member of the step's teams, not the requester, not the current owner | Human step In review |
| Approve / Reject | The step's owner | Step In review |
| Reassign | Users with "reassign" permission | Step Awaiting or human step In review |
| Restart | Requester, users with "reassign" | AI or automation step Failed |
| Cancel review | Requester, users with "reassign" | Review In progress |
| Create new revision | Anyone who can edit the content | Review Rejected |
| Remove review request | Developers only (developer mode) | Review Rejected |

Approving a step needs no comment; rejecting needs a comment (at least 10 characters).

### 1.6 Global rules for every screen

- Every screen has loading, empty, error and no-permission states. Errors from the server come with a message and, for forms, the exact field; show them where they belong.
- The UI updates live: when anything in a review changes (someone approves, an AI finishes), open screens refresh without a reload.
- Workflows is licence-gated. Without the licence none of this UI appears. AI steps additionally need the AI Power-Ups licence.

---

## 2. Workflow editor

**Purpose.** Administrators build and maintain the workflow for a model.

**Who.** Users with the workflows "editor" permission.

**Entry points.** Headless CMS → Workflows (one entry per publishable model), Website Builder → Workflows (Pages). Today these are separate menu entries per app; keep that.

**Shows.**
- The list of models the admin can attach a workflow to, with an indicator of which already have one. Searchable.
- For the selected model: the workflow name and its ordered steps. Each step shows its title, colour, type, and a one-line summary (Review: teams and how reviewers are chosen; Automation: which automation; AI: model role and number of tools).
- Visual anchors before the first step ("Draft") and after the last ("Published") help admins read the flow; they are not editable.

**Actions.**
- Create a workflow for a model that has none.
- Add a step: choose the type first (Review, Automation, AI), then configure it. AI appears only with the AI Power-Ups licence; Automation only if at least one automation is available for this model. Type cannot be changed later.
- Edit, reorder (move up/down or drag), delete a step.
- Delete the workflow. Blocked while reviews using it are in progress; the error says how many.
- **Save** the whole workflow explicitly. There is no auto-save and no per-step save. Unsaved changes are clearly indicated; leaving with unsaved changes asks for confirmation.

**States and edge cases.**
- No workflow yet for the selected model: empty state inviting the admin to create one.
- Model already bound to another workflow (v1 allows one workflow per model): save error on the model.
- Validation errors from save appear on the exact step, rule or field.
- Flags shown without saving: a rule targeting a user or team no longer in the step's teams; a rule referencing a folder that no longer exists; an automation whose definition is missing or whose settings no longer validate; a user target who cannot read this content.
- Editing a workflow never changes reviews already running; say so near the Save action ("Changes apply to new review requests").

---

## 3. Step editor (per type)

Common fields for every step type:
- Title (required), colour (required), description (optional).
- **Notify via**: choose channels from the available transports (e-mail today). In-app notifications are always sent and are not an option. Who gets notified is automatic (see section 9).

### 3.1 Review step

- **Reviewing teams** (at least one).
- **Assignment** section (section 4).

### 3.2 Automation step

- **Automation**: pick one from the automations available for this model (name and description). v1 ships "Send webhook".
- **Settings**: a form generated from the automation's settings schema. Fields can be text, numbers, toggles, selects, user or team pickers, multi-line text, and **secret** fields. Secret fields are write-only: once saved, they show as "Set" with a "Replace" action, never the value.
- Warning state when the chosen automation no longer exists or its saved settings no longer validate.

### 3.3 AI step

- **Instructions**: multi-line text, the reviewer prompt ("Check tone of voice, flag any personal data…").
- **Model role**: choose from the AI Power-Ups roles (e.g. Fast, Standard); default preselected.
- **Tools**: choose which tools the AI may use, from a list with name and description. Some tools can change the content under review (e.g. "Update fields"); mark these clearly.
- Hidden entirely without the AI Power-Ups licence.

---

## 4. Assignment and routing (review steps)

**Purpose.** Decide who reviews a step, automatically or by the requester's choice.

**Shows and edits.**
- **Strategy**: None (team pool), Round-robin, Least-loaded. One-line explanation of each.
- **Let the requester pick a reviewer**: toggle.
- **Routing rules**: an ordered list. First matching rule wins, so order matters and must be easy to change. Each rule has:
  - Conditions, all optional and combined with AND: requester is a specific user; requester belongs to a team; content is in a folder (toggle: include subfolders). A "content model" condition exists but is not shown in v1.
  - Target: a specific user, or a team. Only users and teams within the step's reviewing teams can be chosen.
  - A readable summary line per rule, e.g. "If requester is in Marketing and content is in /Campaigns (incl. subfolders) → Ana Kovač".
- **Test routing** panel: choose a requester and a folder; see the resulting owner (or "Team pool"), a trace of every rule (matched / not matched / skipped and why) and what the strategy chose. It tests the unsaved configuration currently on screen.

**Pickers.**
- User pickers search all tenant users. Team pickers for rule targets show only the step's teams.
- Folder picker shows only folders the admin can access. A rule pointing at a folder the admin cannot see shows "Restricted folder" and is kept as is.

**Edge cases.**
- Rule target no longer in the step's teams, user without read access to this content, deleted folder: show a warning on that rule.
- No rules and strategy None: plain team pool, as today.
- The assignment section does not exist for Automation and AI steps.

---

## 5. Request review dialog

**Entry point.** "Request review" in the review bar of the CMS entry editor and the Website Builder page editor.

**Shows.**
- **Title** of the review, prefilled from the entry or page title (required, at least 5 characters).
- **Steps preview** (read-only): each step's name, type, and how its reviewer will be chosen ("Team pool", "Routed automatically", "AI", "Automation").
- **Reviewer choice**, only for steps that allow picks: "Automatic" (preselected) or "Choose a person". The person picker lists only that step's eligible reviewers. Users on the exclusion list appear disabled with their reason. The requester is not listed.

**Behaviour.**
- One confirm action. When nothing needs choosing, it is a single click.
- The pick is checked again when the step is reached; if the person is no longer eligible, the system assigns automatically. The dialog can say this briefly.

**States.** Submitting; server error; content changed under the user (error asking to reload).

---

## 6. Review bar, tooltip and dialogs (inside the content editors)

**Where.** Above the CMS entry form, and in the Website Builder page editor's top bar area. Shown only when the model has a workflow.

**Purpose.** Tell everyone looking at this revision where it stands, and offer the next action.

**Shows (compact).**
- Current review state and the current step (name, colour, state).
- Current owner with actor type (person, AI, automation) or "Team pool".
- When content is locked by an active review, a clear note that the content cannot be edited.
- A way to open **review details** (section 7).
- A compact progress indicator across all steps (the tooltip or popover can show each step's state and comment).

**Bar per situation** (the designer decides the visual form; each needs its own message and actions):

| Situation | Message idea | Actions (if allowed) |
|---|---|---|
| Model has a workflow, no review yet | This content needs review before publishing | Request review |
| Step awaiting in pool, viewer can start | Waiting for a reviewer from Legal | Start |
| Step awaiting, viewer cannot start | Waiting for a reviewer from Legal | Reassign, Cancel |
| Step in review, viewer is owner | You are reviewing this step | Approve, Reject |
| Step in review, owner is someone else | Ana Kovač is reviewing | Take over, Reassign, Cancel |
| AI or automation running | AI review running since 10:42 | Cancel |
| AI or automation failed | AI review failed: provider unavailable | Restart, Cancel |
| Review approved | Approved, ready to publish | (publish is the editor's normal action) |
| Review rejected | Rejected at Legal: "…comment…" | Create new revision; developer-only Remove review request |
| Review cancelled | (no bar, back to "no review yet") | Request review |

**Dialogs.**
- **Approve**: optional comment.
- **Reject**: required comment, at least 10 characters. State plainly that rejection is final for this revision.
- **Take over**: confirm, naming the current owner.
- **Reassign**: pick a person from the step's eligible reviewers (excluded users disabled with reason). Both old and new owner are notified.
- **Cancel review**: confirm. If an AI or automation is running, say it will be stopped.
- **Restart**: confirm; shows the last failure reason.
- After an action, a short confirmation with a link to the Content Reviews page. The confirmation must name the step that was acted on (not the next step).

**Website Builder note.** A rejected page revision needs a visible "Create new revision" action that opens the new revision.

---

## 7. Review details

**Purpose.** Full history of one review and the answer to "why did this reach me?".

**Entry points.** From the review bar, from any list row, from dashboard widgets.

**Shows.**
- Header: review title, content (model, link to open it), requester, created, current state.
- **Timeline of steps**, in order. For each step: type, state, owner with actor type, when it was reached, started and finished, comment, and:
  - **Why this owner**: one line, e.g. "Assigned by rule 'Legal content'", "Picked by requester", "Round-robin", "Sent to pool: all candidates excluded", "Reassigned by Ivan", "Taken over by Ana".
  - For AI steps: the list of **issues** the AI reported (field, severity, message, suggestion).
  - For AI and automation steps: earlier attempts (start, end, outcome, reason). Users with "editor" or "reassign" see a link to each run in the Background Tasks admin.
- Users with "editor" or "reassign" also see per-user skip details (who was skipped and why, including exclusion reasons). Others see only the outcome line.
- The same actions as the bar, where allowed.

---

## 8. Content Reviews page and dashboard widgets

### 8.1 Content Reviews page

**Entry point.** Main menu (Workflows → Content Reviews), and links from success confirmations and widgets.

**Tabs.**
- **Assigned to me**: steps I own and am reviewing.
- **Pool**: steps waiting in a pool of a team I belong to (excluding my own requests).
- **Team in review**: steps in my teams that someone else is reviewing.
- **My requests**: reviews I requested.

**Filters.** Model, review state, step state; search by title.

**Columns.** Title, model, current step, step state, owner, requester, last change.

**Row actions** (only where allowed): open content, open in new window, view details, start, take over, reassign. Approve and reject are not available from the list; reviewers open the content first.

**States.** Empty state per tab with a helpful message ("Nothing assigned to you"). Results are loaded in pages; counts may be approximate, so avoid showing exact totals.

### 8.2 Dashboard widgets

- **For me to review**, with two tabs: Assigned to me, Pool.
- **My requests**.
- Each shows a few recent items with title, step, state, and "View all" opening the matching Content Reviews tab.

---

## 9. Notifications (what users receive)

Not a screen, but the designer may need it for copy and in-app notification design.

| Event | Who is notified |
|---|---|
| Step reached, team pool | Members of the step's teams (not the requester, not excluded users) |
| Step started by routing, a pick or reassignment | The new owner |
| Reassignment | Previous and new owner |
| Review approved, review rejected, a step failed | Requester |
| Review cancelled | Current owner, if any |

The whole team is never notified about work that went to one person. In-app notifications always go out; e-mail goes out when the step's "Notify via" includes it.

---

## 10. Settings: exclusion list

**Purpose.** Temporarily take people out of automatic assignment (leave, workload).

**Entry point.** Settings menu → Workflows → Exclusions (or similar).

**Who.** Users with the workflows "editor" permission.

**Shows.** List of excluded users: name, reason (optional), until (optional end date), status (active or expired).

**Actions.** Add (pick user, optional reason, optional end date), edit, remove. The end date is picked as a date and means "until the end of that day" in the admin's timezone.

**Behaviour to communicate.**
- Excluded users are skipped by automatic assignment and shown as unavailable in reviewer pickers, with the reason.
- Work they already hold stays with them.
- Excluded users can still start or take over work themselves.

**States.** Empty list; expired entries (visually de-emphasised, or a filter); saving errors.

---

## 11. Permissions (Security → Roles)

Workflows permissions inside the existing role editor:
- **No access**, **Full access**, or **Custom**.
- Custom shows two checkboxes:
  - **Manage workflows**: create and edit workflows, manage the exclusion list.
  - **Reassign and operate**: reassign reviewers, restart failed automated steps, cancel reviews requested by others.
- Reviewing itself is not a permission; it comes from team membership.

---

## 12. Out of scope (do not design)

- Several workflows on one model, or one workflow for several models (later).
- A "content model" routing condition in the editor (later).
- A locale routing condition.
- Comment threads and discussion on reviews (later, via the collaboration feature). v1 has one comment per step decision.
- Audit log screens for workflows.
- A notification inbox; the Content Reviews tabs serve that role.
- Status columns or filters in the CMS entry list or Website Builder page list.
