# APW - Routing rules

# Product Brief: Reviewer Routing for Advanced Publishing Workflows

Internal document. Audience is the engineer implementing the feature.

Routing rules sit at the centre of this work, but they only make sense alongside the automatic assignment strategies, the exclusion list, and manual selection, because all four produce a reviewer and have to agree on precedence. This brief covers the whole reviewer assignment picture rather than rules in isolation.

This is a product document. It describes behaviour, not architecture. The engineering handoff covers the design decisions and their reasoning, and the discovery brief covers what needs establishing in the codebase first.

## The problem

A workflow step names a reviewing team. Everyone in that team sees the content sitting in their pending queue, and whoever gets to it first assigns themselves.

That works for a small team with even expertise. It degrades in three ways as an organisation grows.

Nobody owns anything until somebody volunteers, so content can sit in a shared queue for days with each reviewer assuming another will pick it up. Load lands unevenly, because the same two conscientious people take most of it while others rarely engage. And organisations that need particular content seen by particular people have no way to express that, so they rely on convention and Slack messages.

The client driving this has the third problem most acutely. They need certain content routed to named reviewers based on who submitted it and where it lives, and today they cannot describe that to the system at all.

## Who this affects

Workflow administrators configure steps and will now configure how assignment happens. They are the ones who need to be able to reason about why a given reviewer was chosen.

Editors request reviews. Most of the time assignment should be invisible to them. Sometimes they know who should look at something and want to say so.

Reviewers receive work. The change they feel is going from a shared pool to something that arrives with their name on it.

## What changes

Each manual step gains an assignment configuration with an automatic strategy, an ordered list of routing rules, and a setting controlling whether the editor can choose a reviewer at submit time. Separately, the tenant gains a list of users who should be skipped by automatic assignment.

Automated steps have no reviewer, so none of this applies to them. The assignment section should not appear when a step's resolution type is a check or an AI step.

### Resolution order

When a step needs a reviewer, the first of these to produce one wins.

1. A reviewer the editor selected manually at submit time, where the step allows it.
2. The first routing rule whose conditions all match.
3. The step's automatic strategy.
4. Nothing, which leaves the content in the team pool exactly as it behaves today.

Falling through to the pool is a legitimate outcome, not a failure. Assignment never blocks a review from being created.

### Automatic strategies

**None** preserves current behaviour. Content appears in the team pool unassigned.

**Round-robin** rotates through the members of the step's reviewing team in a stable order, skipping anyone excluded and skipping the requester.

**Least-loaded** picks whoever currently holds the fewest open review assignments across the tenant. Counting across the tenant rather than within the step matters because reviewers frequently sit on several teams, and a per-step count would tell you almost nothing about how busy someone actually is. Ties go to whoever was assigned least recently.

### Routing rules

A rule is a set of conditions and a target. Rules belong to a step, are ordered, and the first one whose conditions all match wins. Later rules are not evaluated.

Conditions available:

- the requester is a specific user
- the requester belongs to a specific team
- the content sits in a specific folder, with a toggle for whether descendant folders count
- the content is of a specific model
- the content is in a specific locale

Conditions within a rule combine with AND. There is no OR and no nesting. Someone needing alternatives writes two rules.

The target is a user or a team, and it must sit within the step's configured reviewers. A user target assigns that person. A team target narrows the candidate pool to that team, and the step's automatic strategy then runs within the narrowed set. If the strategy is none, the content lands in that team's pool unassigned.

The deliberate limitation here is that a rule cannot route to a team outside the step's reviewers. Doing so would change who holds sign-off authority for the step, which is a larger change to the permission model than this phase should carry. Expect the client to eventually ask for it.

### Manual selection

Off by default. When on, requesting a review presents the editor with a choice between automatic assignment and picking a person.

Automatic is preselected, so an editor with no opinion confirms and moves on. The picker lists the step's reviewers, excludes the requester, and shows excluded users as disabled with the reason visible.

In a workflow where several steps allow manual selection, capture all of them in the same submit interaction rather than asking again later. Each defaults to automatic. An editor typically has an opinion about the first reviewer and none about the rest, so the interaction should not feel like a form to fill in.

Automatic resolution still happens when each step becomes active, so rules and strategies evaluate against current team membership and current load rather than whatever was true at submission.

### Exclusion list

Tenant-level. Each entry names a user, optionally records a reason, and optionally carries an end date after which it lapses on its own.

The end date exists because a list without one accumulates. People get added while on leave and stay there permanently, and eventually nobody remembers why the rotation skips someone.

Exclusions apply to everything automatic. Round-robin skips them, least-loaded skips them, and a routing rule targeting an excluded user is skipped so evaluation moves to the next rule. In the manual picker they remain visible but cannot be chosen, with the reason shown, so an editor understands the constraint rather than assuming something is broken.

Exclusions govern new assignments only. Work already sitting with someone who gets excluded stays with them.

### Reassignment

An active step's assignee can be changed. Both the previous and new assignee are notified, an audit entry is written, and step state is otherwise untouched.

Cancelling and re-requesting a review is already a takeover path, but it discards the review's progress. Reassignment covers the ordinary case where one reviewer is away for a fortnight and somebody else on the team can handle it.

## Behaviour in specific situations

**The requester is a member of the reviewing team.** They are never assigned to review their own submission. Exclude them from the candidate pool for both strategies. If a routing rule targets them as an individual, skip the rule.

**A rule targets someone who has left.** Validate targets when the rule is saved and again when it is evaluated. An invalid target does not fail the review, it skips the rule and evaluation continues.

**Every candidate is excluded, or the team is empty.** Fall through to the unassigned pool and record why. The review still gets created.

**A folder referenced by a rule is deleted or moved.** The rule should not silently start matching different content. Establish what ACO does on folder deletion during discovery and decide the behaviour from there. Flag it in the editor if a rule references a folder that no longer exists.

**Content is moved between folders mid-review.** Rules already evaluated do not re-evaluate. Later steps evaluate against the folder as it stands when they become active.

**The reviewing team changes after rules were written.** A rule target that is no longer within the step's reviewers is invalid, and behaves the same as a departed user. The workflow editor should surface this rather than waiting for a review to hit it.

**Assigned content and the team pool.** Assignment is a strong default, not a lock. Assigned content stays visible to the reviewing team so somebody else can act on it if needed. The assignee gets the notification and sees it in their own view.

## Surfaces

The **workflow step editor** gains an assignment section holding the strategy selector, the rule list with ordering, and the manual selection toggle. Rules need to be reorderable, since order determines the outcome.

Rules also need to be inspectable. An administrator should be able to ask what happens if a given user requests a review for content in a given folder, and see both the resulting assignee and which rule produced it. A rule set that can only be understood by reading it top to bottom will generate support questions within a month of a customer configuring more than three rules.

The **request review dialog** gains the automatic-or-manual choice for steps that allow it.

The **content review view** shows the current assignee per step and the reassign action for those with permission. Where useful, showing which rule produced an assignment helps reviewers understand why something reached them.

**Tenant settings** gain the exclusion list.

## Notifications

An assigned reviewer is notified directly rather than relying on them noticing something in a shared queue. That is most of the value of assignment.

Reassignment notifies both parties.

Resist notifying the whole team about an assignment that went to one person. The pool view already shows it, and the channel becomes noise quickly.

## Permissions

Configuring assignment, rules, and the exclusion list falls under the existing workflow editing permission. Confirm during discovery that this is restricted appropriately, since routing rules are a way of directing work at named individuals.

Reassigning an active review needs its own permission, distinct from the ability to sign off.

## Out of scope

Rules attached to anything other than a step. No workflow-level or tenant-level rules, and no shared rule library that several steps reference.

Rules that route to a team outside the step's configured reviewers.

Conditions beyond the closed set listed above, and any expression language.

Automatic escalation or reassignment on timeout. If a review sits untouched, a human notices and reassigns.

Availability as a first-class concept, meaning calendars, working hours, or presence. The exclusion list is the deliberate simplification.

Load balancing that accounts for how large or complex a piece of content is. Least-loaded counts assignments, nothing more.

## Open questions

The cost of counting open assignments per user across a tenant. This determines whether least-loaded is viable as described, and is the first thing discovery should settle.

Whether folder descendant matching is cheap enough to run at review-request time.

What the pending-review pool query should become once assignment exists, given that assigned content stays visible to the team.

Behaviour when a rule's referenced folder is deleted.

## What good looks like

The client's stated requirement is expressible, meaning a rule of the form "when this person submits content in this folder or below it, this reviewer gets it" can be configured and behaves predictably.

An administrator can explain any assignment the system made without reading the code.

Nothing changes for existing workflows. A step with no assignment configuration behaves exactly as it does today, and no migration is needed to keep it that way.

Assignment failure never prevents a review from being created.

We are not setting numeric targets on review turnaround for this. We do not have a baseline to measure against, and inventing one would give us a figure nobody could defend later. If turnaround measurement is wanted, it needs instrumenting first as a separate piece of work.
