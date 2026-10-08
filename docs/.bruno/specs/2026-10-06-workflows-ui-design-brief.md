# Workflows UI: design brief

Status: draft, 2026-10-06. Audience: Claude Design, designing with the Webiny admin design system. This brief describes what each screen is for, who uses it, what it shows, what users can do, and every state it must handle. Layout, component choice and visual treatment are the designer's call.

Source of truth for behaviour: `docs/.bruno/specs/2026-10-05-workflows-refactor-design.md` and the decision log `docs/.bruno/workflows/decisions.md` (UI decisions D88-D100).

---

## 1. Context

### 1.1 What workflows are

Advanced Publishing Workflows is an enterprise Webiny feature. An administrator attaches a workflow to a content model (a Headless CMS model, or Website Builder pages). A workflow is an ordered list of steps. Before a revision of that content can be published, someone requests a review, and the revision has to pass every step in order. Each step is done by people, an AI, or an automation. When all steps approve, the revision can be published. If any step rejects, that revision is finished: the editor creates a new revision, fixes the issue, and requests a new review.

### 1.2 Who uses it

| Persona | What they do | How often |
|---|---|---|
| Workflow administrator | Builds workflows: steps, reviewing teams, routing rules, automations, AI steps. Manages the tenant's exclusion list. Investigates "why was this assigned to X?". | Occasionally, high stakes |
| Content author (requester) | Writes content, requests a review, optionally picks a reviewer, follows progress, creates a new revision after a rejection. | Daily |
| Reviewer | Gets assigned work or picks it from the team pool, reviews, approves or rejects with a comment, takes over work from a colleague. | Daily |
| Workflow operator | Moves work between reviewers, restarts failed automated steps, cancels reviews. | Occasionally |

One person can hold several roles. A requester can never review their own content.

### 1.3 Terms (use these words in the UI, one word per concept)

- **Workflow**: the definition (steps) attached to a model.
- **Review**: one run of a workflow on one revision of an entry or page. "Review" never names a step type.
- **Requester**: the person who requested the review.
- **Step**: one stage of a review.
- **Step types**: **People** (members of one or more teams review), **Automation** (code-defined, e.g. "Send webhook"), **AI** (an AI model reviews against written instructions) [D98].
- **Reviewing teams**: the teams allowed to review a People step. A routing rule can narrow them to one team for a particular review.
- **Owner**: who currently holds a step. For People steps, a person. For AI and Automation steps, the step's title (never the automation's name, never a person's name) [D107].
- **Team pool**: a People step nobody owns yet; any eligible team member can start it. Use "Team pool" everywhere (not "pool" alone, not "waiting").
- **Picked**: the requester chose the reviewer when requesting.
- **Routed**: the system chose the reviewer, by a routing rule or a strategy.
- **Content type**: what lists call the model of an entry or page, shown as name plus app ("Article · Headless CMS", "Pages · Website Builder"). "Model" stays only where an admin configures a specific CMS model [D113].
- Never use the word "manual" for assignment.

Permission labels (as shown in the role editor, section 11): **Manage workflows** and **Reassign and operate**. Use these labels wherever the brief refers to permissions.

### 1.4 States

Step states, six in total; each needs a distinct, recognisable treatment:

| State | Meaning |
|---|---|
| Pending | Not reached yet. |
| Awaiting | Reached, in the team pool, nobody started it. |
| In review | A person is reviewing. For AI and Automation steps the same state is labelled **Running**; it is not a separate state. |
| Approved | Passed. |
| Rejected | Failed by decision. Final for this revision. |
| Failed | AI or automation hit a technical error. Can be restarted. |

Review states: **In progress**, **Approved**, **Rejected**, **Cancelled**. Cancelled reviews never appear in lists; the revision simply has no review again.

### 1.5 What a review does to the content

| Review state | Editing the revision | Publishing | Moving to another folder |
|---|---|---|---|
| No review (model has a workflow) | Allowed | Blocked: needs an approved review | Allowed |
| In progress | Blocked | Blocked | Blocked |
| Approved, not yet published | Blocked (to change it: create a new revision, which needs a new review) | Allowed | Allowed |
| Approved and published | Blocked (same as above) | Already published | Allowed |
| Approved, published, then unpublished | Blocked (same as above) | Allowed again, no new review [D121] | Allowed |
| Rejected | Blocked permanently (create a new revision) | Blocked | Allowed |
| Cancelled | Allowed (same as no review) | Blocked: needs an approved review | Allowed |

Content whose model has no workflow behaves normally; none of the workflow UI appears.

The publish action in both the CMS entry editor and the Website Builder page editor must reflect this table (disabled with an explanation when blocked).

### 1.6 Actions and who sees them

The server computes which actions the current viewer may take; the UI shows exactly those, and nothing else.

| Action | Who | When |
|---|---|---|
| Request review | Anyone who can edit the content | No active review on the revision, model has a workflow |
| Start | Member of the step's reviewing teams who can read the content, not the requester | Step Awaiting |
| Take over | Member of the step's reviewing teams who can read the content, not the requester, not the current owner | People step In review |
| Approve / Reject | The step's owner | Step In review |
| Reassign | Reassign and operate | Step Awaiting, or People step In review |
| Restart | Requester, Reassign and operate | AI or Automation step Failed |
| Cancel review | Requester, Reassign and operate | Review In progress |
| Create new revision | Anyone who can edit the content | Review Rejected, or Approved (to make further changes) |
| Remove review request | Developers only (developer mode) | Review Rejected |

- Approve: comment optional. Reject: comment required, at least 10 characters [D100].
- Requesting a review with unsaved changes in the editor discards those changes; no special handling [D99].
- People who can read but not edit the content, and requesters who cannot act on the current step, see status only.

### 1.7 Global rules for every screen

- Every screen has loading, empty, error and no-permission states. Server errors come with a message and, for forms, the exact field; show them where they belong.
- Live updates: when anything in a review changes (someone approves, an AI finishes, an automation edits the content), open screens refresh without a reload.
- Concurrent actions: if someone else acted first (took over, cancelled, approved), the action fails. Keep anything the user typed (e.g. a comment), say who acted and what changed, and refresh.
- Licensing: without the workflows licence none of this UI appears. AI steps also need the AI Power-Ups licence.
- Lists are loaded incrementally ("load more"); there are no total counts anywhere (tabs, widgets, lists, and no per-person workload counts in reviewer pickers [D104]).

---

## 2. Workflow editor

**Purpose.** Administrators build and maintain the workflow for a model.

**Who.** Manage workflows.

**Entry points.** One "Workflows" entry in the Headless CMS menu and one in the Website Builder menu, visible only with Manage workflows. The CMS entry lists every publishable model; the Website Builder entry has a single item, Pages.

**Shows.**
- The list of models the admin can attach a workflow to, with an indicator of which already have one. Searchable.
- For the selected model: the workflow name and its ordered steps. Each step shows its title, colour, type, and a one-line summary (People: teams and how reviewers are chosen; Automation: which automation; AI: model and number of tools).
- The flow must be easy to read as "draft → steps in order → published".

**Actions.**
- Create a workflow for a model that has none.
- Add a step: choose the type first (People, Automation, AI), then configure it. AI is offered only with the AI Power-Ups licence; Automation only if at least one automation is available for this model. The type cannot be changed later [D91].
- Edit, reorder, delete a step. Reordering must be easy.
- Delete the workflow. Blocked while reviews using it are in progress; the error says how many.
- **Save** the whole workflow explicitly. No auto-save and no per-step save. Unsaved changes are clearly indicated; leaving with unsaved changes asks for confirmation [D92]. Show near Save: "Changes apply to new review requests; reviews already running are not affected."

**States and edge cases.**
- No workflow for the selected model: empty state inviting the admin to create one.
- Model already has another workflow (one workflow per model for now): save error on the model.
- No steps: Save is rejected with "Add at least one step." [D108].
- Save errors appear on the exact step, rule or field.
- Someone else changed or deleted this workflow while it was open: the save fails; explain and offer to reload (the admin's unsaved edits are lost on reload, so say so).
- Warnings shown without saving:
  - a rule targets a user or team no longer in the step's reviewing teams;
  - a rule targets a user who cannot read this model's content;
  - a rule references a folder that no longer exists;
  - a People step's reviewing teams have no members;
  - an automation's definition is missing, or its saved settings no longer validate;
  - an AI step's model is no longer available;
  - an AI step exists but the AI Power-Ups licence is missing (show the step read-only with a licence warning; it fails when reached and can be restarted once the licence is back).
- Deleting a model that has a workflow is blocked elsewhere (Headless CMS model delete) with an error naming the workflow; the model delete dialog must show it.

---

## 3. Step editor (per type)

Common fields for every step type:
- Title (required), colour (required), description (optional).
- **Notify via**: choose channels from the available transports (e-mail today). In-app notifications are always sent and are not an option. Who is notified is automatic (section 9) [D96].

### 3.1 People step

- **Reviewing teams** (at least one). Warn if a chosen team has no members.
- **Assignment** section (section 4).

### 3.2 Automation step

- **Automation**: pick one from the automations available for this model (name and description). The first one available is "Send webhook".
- **Settings**: a form generated from the automation's settings schema. Fields can be text, numbers, toggles, selects, user or team pickers, multi-line text, and **secret** fields. Secret fields are write-only: once saved, they show as "Set" with a "Replace" action, never the value.
- Warning when the chosen automation no longer exists or its saved settings no longer validate.

### 3.3 AI step

- **Instructions** (required): multi-line text, the reviewer prompt ("Check tone of voice, flag any personal data…") [D109].
- **Model** (required): choose a specific AI model from the list of available models [D101]. If a saved model is no longer available, show a warning; the step would fail when reached.
- **Tools**: choose which tools the AI may use, from a list with name and description. Some tools can change the content under review (e.g. "Update fields"); mark these clearly.
- Without the AI Power-Ups licence: the type cannot be added; existing AI steps show read-only with a licence warning.

---

## 4. Assignment and routing (People steps)

**Purpose.** Decide who reviews a step, automatically or by the requester's choice.

**Shows and edits.**
- **Strategy**: None (team pool), Round-robin, Least-loaded. One-line explanation of each.
- **Let the requester pick a reviewer**: toggle.
- **Routing rules**: an ordered list. First matching rule wins, so order matters and must be easy to change. Each rule has:
  - Conditions, all optional and combined with AND: requester is a specific user; requester belongs to a team; content is in a folder (toggle: include subfolders). A "content model" condition exists but is not shown for now.
  - Target: a specific user or a team, chosen from the step's reviewing teams only.
  - A readable summary line, e.g. "If requester is in Marketing and content is in /Campaigns (incl. subfolders) → Ana Kovač".
- **Test routing** panel: choose a requester and a folder; see the resulting owner (or "Team pool"), a trace of every rule (matched / not matched / skipped and why) and what the strategy chose. It tests the unsaved configuration currently on screen [D95].

**Pickers.**
- Requester condition ("requester is user"): any user in the tenant.
- Requester team condition: any team.
- Target user: members of the step's reviewing teams only. Target team: the step's reviewing teams only.
- Folder: only folders the admin can access. A rule pointing at a folder the admin cannot see shows "Restricted folder" and is kept unchanged.

**Edge cases.**
- Warnings per rule: target no longer in the reviewing teams; target user cannot read this content; folder deleted.
- No rules and strategy None: plain team pool.
- The assignment section does not exist for Automation and AI steps.

---

## 5. Request review dialog

**Entry point.** "Request review" in the review bar of the CMS entry editor and the Website Builder page editor.

**Shows.**
- **Title** of the review, prefilled from the entry or page title; required, at least 5 characters [D100].
- **Steps preview** (read-only): each step's name, type, and a label for how its reviewer will be chosen, derived from the step's configuration: "Team pool" (People step, no rules, strategy None), "Assigned automatically" (People step with rules or a strategy), "AI", "Automation". Never show a predicted person.
- **Reviewer choice**, only for People steps that allow picks: "Automatic" (preselected) or "Choose a person". The person picker lists only that step's eligible reviewers; the requester is never listed. Excluded users appear disabled as "Unavailable"; the reason is shown only to users with Manage workflows or Reassign and operate [D97].

**Behaviour.**
- One confirm action. When nothing needs choosing, it is a single click.
- Picks are checked again when the step is reached; if the person is no longer eligible, the system assigns automatically. Say this briefly next to the picker.
- If a step has no eligible reviewer other than the requester (or the picker has nobody to choose), show a notice that the step may wait in the team pool until someone reassigns it.

**States.** Submitting; server error; the revision already has a review (someone requested first): explain and refresh.

---

## 6. Review bar, tooltip and dialogs (inside the content editors)

**Where.** Above the CMS entry form, and in the Website Builder page editor's top bar area. Shown only when the content's model has a workflow, on every revision.

**Purpose.** Tell everyone looking at this revision where it stands, and offer the next action.

**Shows (compact).**
- Current review state and the current step (name, colour, state).
- Current owner per section 1.3, or "Team pool".
- What the review does to the content right now (section 1.5), e.g. "Editing is locked while this revision is in review".
- A way to open **review details** (section 7).
- A compact progress indicator across all steps; a tooltip or popover shows each step's state and comment.

**Bar per situation.** Every row shows all actions the viewer is allowed (section 1.6); the "Actions" column lists the full possible set. Viewers without any allowed action see status only.

| Situation | Message idea | Possible actions |
|---|---|---|
| Model has a workflow, revision has no review | This content needs review before publishing | Request review |
| Step Awaiting in the team pool | Waiting in the Legal team pool | Start, Reassign, Cancel review |
| Step In review, viewer is the owner | You are reviewing this step | Approve, Reject, Reassign, Cancel review |
| Step In review, owner is someone else | Ana Kovač is reviewing | Take over, Reassign, Cancel review |
| AI or Automation Running | AI check running since 10:42 | Cancel review |
| AI or Automation Failed | AI check failed: provider unavailable | Restart, Cancel review |
| Review Approved, not published | Approved, ready to publish | Create new revision |
| Review Approved, published | Approved and published | Create new revision |
| Review Rejected | Rejected at Legal: "…comment…" | Create new revision; developer-only Remove review request |
| Review Cancelled | Bar returns to the "no review" row | Request review |
| Revision published before the workflow existed | This content needs review before publishing (applies to new revisions) | Create new revision |

**Content changed by a step.** An Automation or AI step may change the content while it is open. When that happens the editor reloads the content; show a notice such as "Content updated by AI check".

**Dialogs.**
- **Approve**: optional comment.
- **Reject**: required comment (at least 10 characters). State plainly that rejection is final for this revision.
- **Start**: confirm ("You become the owner of this step and it leaves the team pool."), in the editors and in the Content Reviews list alike [D114].
- **Take over**: confirm, naming the current owner.
- **Reassign**: pick a person from the step's eligible reviewers (excluded users disabled; reason per section 5). The previous owner (if any) and the new owner are notified. Empty state when nobody is eligible.
- **Cancel review**: confirm. Say that review progress is lost and a new request starts from the first step. If an AI or automation is running, say it will be stopped.
- **Restart**: confirm; shows the last failure reason.
- After an action, a short confirmation naming the step that was acted on (not the next step), with a link to the Content Reviews page.

**Website Builder.** A rejected or approved page revision needs a visible "Create new revision" action that opens the new revision. The WB editor only edits draft revisions; the bar must still show the review state on non-draft revisions.

---

## 7. Review details

**Purpose.** Full history of one review and the answer to "why did this reach me?" [D88].

**Entry points.** From the review bar, from any list row, from dashboard widgets, from notifications.

**Shows.**
- Header: review title, content (model, link to open it), requester, created, current state.
- **Timeline of steps**, in order, taken from the review's own snapshot (it still renders if the workflow was later edited or deleted). For each step: type, state, owner (section 1.3), when it was reached, started and finished, comment, and:
  - **Why this owner**: one line, e.g. "Assigned by rule 'Legal content'", "Picked by requester", "Round-robin", "Sent to team pool: all candidates excluded", "Reassigned by Ivan", "Taken over by Ana", "Started from team pool".
  - For AI steps: the issues the AI reported (field, severity, message, suggestion).
  - For AI and Automation steps: earlier attempts (start, end, outcome, reason). Users with Manage workflows or Reassign and operate see a link to each run in the Background Tasks admin [D90].
- Users with Manage workflows or Reassign and operate also see per-user skip details (who was skipped and why, including exclusion reasons). Others see only the "why this owner" line [D89].
- The same actions as the bar, where allowed.

**No access.** Someone without read access to the content (e.g. arriving from a notification or a shared link) sees a no-permission state, not the review.

---

## 8. Content Reviews page and dashboard widgets

### 8.1 Content Reviews page

**Entry point.** Main menu "Content Reviews", visible to every user with the workflows licence (reviewing needs no workflows permission). Also linked from action confirmations, widgets and notifications.

**Tabs.**
- **Assigned to me**: People steps I own and am reviewing.
- **Team pool**: steps waiting in the team pool of a team I belong to (excluding my own requests).
- **Team in review**: People steps in my teams that someone else is reviewing.
- **My requests**: reviews I requested.
- **Failed steps** (only with Reassign and operate): AI or Automation steps that failed, on any review the user can read; row actions add Restart and Cancel review [D112].

**Filters.** All tabs: content type, search by title. **My requests** only: review state (In progress, Approved, Rejected) and step state. The other tabs have a fixed step state, so no state filter. Cancelled reviews never appear.

**Columns.** Title, content type, current step, step state, owner, requester, last change. Only Last change is sortable: oldest first in the work-queue tabs, newest first in My requests, toggleable; it updates on every review event, not on edits outside the review [D119].

**Row actions** (only where allowed): open content, open in new window, view details, start, take over, reassign. Approve and reject are not available from the list; reviewers open the content first.

**States.** Empty state per tab with a helpful message ("Nothing assigned to you"). Results load incrementally ("load more"); no totals. Reviews the user cannot read (restricted folders) are not listed.

### 8.2 Dashboard widgets

- **For me to review**, with two tabs: Assigned to me, Team pool.
- **My requests**.
- Each shows a few recent items with title, step and state, and "View all" opening the matching Content Reviews tab. No counts.

---

## 9. Notifications (what users receive)

Not a screen, but the designer needs it for copy and in-app notification design. Each notification links to the content or the review details.

| Event | Who is notified |
|---|---|
| Step reached, team pool | Members of the step's reviewing teams (not the requester, not excluded users) |
| Step started by routing, a pick or reassignment | The new owner |
| Reassignment | Previous owner (if any) and new owner |
| Take over | Previous owner, unless the taker unticks "Notify {name} that you took over" in the Take over dialog (checked by default) [D111] |
| Review approved, review rejected, a step failed | Requester |
| Review cancelled | Current owner, if any |

The whole team is never notified about work that went to one person. In-app notifications always go out; e-mail goes out when the step's "Notify via" includes it.

An in-app notification is a toast (title, one short line, link) shown while the recipient has the admin open. There is no notification list, history or read/unread state: notifications are not stored, and the Content Reviews tabs show the work [D102].

Whoever decided is named by person for People steps and by step title for AI and Automation steps (never the automation's name). A rejection without a comment reads "Rejected at {step} by {decider}." [D107]

E-mail for a review-level event follows the "Notify via" of the step where it happened: approved uses the last step, rejected the step that rejected, cancelled the step the review was on, failed the failed step [D103].

---

## 10. Settings: exclusion list

**Purpose.** Temporarily take people out of automatic assignment (leave, workload).

**Entry point.** Settings menu, under a Workflows group ("Reviewer exclusions" or similar).

**Who.** Manage workflows.

**Shows.** List of excluded users: name, reason (optional), until (optional end date), status (active or expired).

**Actions.** Add (pick user, optional reason, optional end date), edit, remove. The end date is picked as a date and means "until the end of that day" in the admin's browser timezone [D73]. The list shows it in the viewer's local time, with the full time and timezone on hover; active or expired is the same for everyone [D110]. Each user appears at most once: adding someone already in the list (active or expired) says "This user is already in the list. Edit it instead." and links to their entry; excluding them again means editing that entry [D105].

**Behaviour to communicate.**
- Excluded users are skipped by automatic assignment and shown as "Unavailable" in reviewer pickers.
- The reason is visible only to users with Manage workflows or Reassign and operate [D97].
- Work they already hold stays with them.
- Excluded users can still start or take over work themselves.

**States.** Empty list; expired entries (de-emphasised or filterable); save errors. No conflict handling between admins: the last save wins [D106].

---

## 11. Permissions (Security → Roles)

Workflows permissions inside the existing role editor [D54]:
- **No access**, **Full access**, or **Custom**.
- Custom shows two checkboxes:
  - **Manage workflows**: create and edit workflows, manage the exclusion list, use routing tools.
  - **Reassign and operate**: reassign reviewers, restart failed automated steps, cancel reviews requested by others.
- Reviewing is not a permission; it comes from team membership plus read access to the content.

---

## 12. Out of scope (do not design)

- Several workflows on one model, or one workflow for several models (later).
- A "content model" routing condition in the editor (later).
- A locale routing condition.
- Comment threads and discussion on reviews (later, via the collaboration feature). For now there is one comment per step decision.
- Audit log screens for workflows.
- A notification inbox; the Content Reviews tabs serve that role.
- Review status columns or filters in the CMS entry list or Website Builder page list. (Those lists only stop bulk actions on revisions locked by a review.)
