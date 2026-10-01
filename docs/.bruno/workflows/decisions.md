# Workflows: decisions

Decisions taken while discussing the open questions in `README.md`. Newest at the bottom.

## D1. Stored shape is free to change

`wbyWorkflow` and `wbyWorkflowState` (and any new workflow models) can be rewritten freely. No data migration, no backward compatibility layer. Fields may be renamed, removed or restructured. The DDB key format is untouched because these stay CMS entries.

## D2. "Step reached" and start policy

"Step reached" = the system reacts when a step becomes current (step 1 on review request, later steps when the previous step is approved). It is not the same as starting the review.

What happens on step reached depends on how the reviewer resolves:

- Manual (team pool): notify the pool. Step waits until one person clicks Start. Only that person reviews.
- Routed (user picked automatically): step starts immediately with that user as owner, same as if they clicked Start.
- AI: step starts immediately. AI acts like a user: starts, reviews, approves or rejects.
- Automation (e.g. API call whose result decides): same as AI.

A routed step whose rules and strategy resolve nobody falls back to manual.

## D3. Owner is a typed actor

Step `owner: { type: "user" | "ai" | "automation", id, displayName }` replaces `savedBy`. Start, approve, reject and comment use one code path for every actor type. No separate branches for AI or automation. Audit and UI show which actor decided.

## D4. Step states

`pending` (not reached), `awaiting` (reached, no owner, in team pool), `inReview` (owned), `approved`, `rejected`, `failed` (AI or automation errored).

## D5. Transitions are identity-free

Domain transitions take an explicit actor and never read the current identity, so they run inside background tasks with no user request. Per-viewer flags (`canReview`, `canTakeOver`, `isOwner`) are computed separately, only when a user reads the review.

## D6. One task per automated step

Each AI or automation step runs in its own background task. A task only resolves its own step. The next step goes through the single "step reached" path (D2), whatever its type; if it is AI or automation, that path triggers a new task. No chaining of steps inside one task.

## D7. Stale-result guard

An automated step carries a run id. When the task finishes it reloads the review and applies its result only if the review is still active, the same step is still current, and the step's run id still matches. Otherwise the result is discarded. Covers cancel mid-run, take-over, and duplicate task runs.

## D8. AI and automation failure

No fallback team. Outcome is `rejected` (the AI or check decided no) or `failed` (technical error: provider down, timeout, bad response). The error text goes into the step comment. A user can restart a failed AI or automation step, which triggers a new run (new run id, D7). Who may restart: the requester and anyone with workflow editor permission. A `rejected` step (any actor) cannot be restarted: the target content must change and the whole workflow starts over.

## D9. Take-over

Assignment is a default, not a lock. A routed step owned by the assigned user can be taken over by another member of the step's team. AI and automation steps can never be taken over; on failure the only action is restart (D8).

## D10. Rejection is final for that revision

A rejected review is never cancelled or reopened. It stays as the permanent record on that target revision. To continue, someone creates a new revision of the entry or page, fixes the issue, and requests a new review on the new revision. Reviews are per revision.

## D11. Owner is the assignee

No separate `assignee` field. A routed step starts with the assigned user as owner (D2, D3). Owner must be stored so it is directly queryable (least-loaded counting, "assigned to me" lists).

## D12. No locale condition

Routing conditions exclude locale for now. CMS entries have no locale, and WB `properties.language` is untyped and only set on translated pages. Add the condition when CMS gains locales.

## D13. AI step capabilities

An AI step acts exactly like a human reviewer: approve or reject, with a comment giving the reason. It never edits content. No human confirmation of its decision (rejection is final, D10). Step config: reviewer instructions (prompt) plus ai-powerups capability and model role.

## D14. Automated steps are defined in code

Automated steps are code definitions, not UI-built. Webiny ships built-ins (e.g. send a webhook, pull an image from an external URL, create records). Users register their own via code.

- Each definition implements only its logic and returns the step outcome. The background task wrapping is framework-owned and invisible to the implementer.
- A definition declares its scope: global, per app, or (CMS) per model or set of models.
- A definition declares a config schema (zod) for per-step settings (e.g. webhook URL). The API exposes it to the admin (e.g. as JSON schema), and the step editor renders a form from it. The admin picks the automation from a list filtered by app or model scope. No schema, no form.

## D15. Workflow to model relation

Workflows bind to models, not "apps". Website Builder pages are a model too. Target design is many-to-many: one workflow for several models, several workflows on one model (v2). v1 ships 1:1, enforced on save, but data shape and code are built for many-to-many.
- Shape: workflow field `models: string[]` with namespaced ids, e.g. `["cms.model1", "cms.model2", "wb.page"]`. Replaces the single `app` string. Queryable (e.g. `models_in`).
- v1 validation on save: exactly one entry in `models`, and no other workflow already bound to it. v2 relaxes both and adds a rule for choosing between several workflows on one model.

## D16. Tenant workflow settings and exclusion list

One private singleton settings model per tenant (e.g. `wbyWorkflowSettings`), reusable for future workflow settings. Exclusion list is a field on it: `exclusions: [{ userId, reason?, endsOn? }]`. Expired entries are filtered in memory.

No artificial cap on the number of exclusions. Saving fails naturally if the record exceeds the DDB 400 KB item limit.

## D17. Breaking changes allowed

GraphQL operations, types and inputs, and the public exports of `app-workflows` / `api-workflows`, may change without compatibility shims. CMS and WB workflow packages are updated in the same change. Admin and API deploy together.
