# Workflows: open questions

Produced by reviewing `decisions.md` (D1-D17) against the brief and discovery docs. Ordered by importance, blocking design first. Answered questions move into `decisions.md`.

## Questions

1. ~~Answered in D19.~~
2. ~~Answered in D20.~~
3. ~~Answered in D21.~~
4. ~~Answered in D22.~~
5. ~~Answered in D23.~~
6. ~~Answered in D24 (WB revision support to check).~~
7. ~~Answered in D25.~~
8. ~~Answered in D26.~~
9. ~~Answered in D27.~~
10. ~~Answered in D28.~~
11. ~~Answered in D29.~~
12. ~~Answered in D30.~~
13. ~~Answered in D31.~~
14. ~~Answered in D32.~~
15. ~~Answered in D33.~~
16. ~~Answered in D34.~~
17. ~~Answered in D35.~~
18. ~~Answered in D36.~~
19. ~~Answered in D37.~~
20. ~~Answered in D38.~~
21. ~~Answered in D39, D40.~~
22. ~~Answered in D41.~~
23. ~~Answered in D42.~~
24. ~~Answered in D43.~~
25. ~~Answered in D44.~~
26. ~~Answered in D45.~~
27. ~~Answered in D46 (WB folder delete guard: bug B1 in bugs.md).~~
28. ~~Answered in D47.~~
29. ~~Answered in D48.~~
30. ~~Answered in D18.~~

## Contradictions

- D12 drops locale; routing.md lists it as a condition. Accepted deviation; record it in the spec.
- D1 (no migration) breaks routing.md "nothing changes for existing workflows, no migration needed". Accepted: next is unreleased (D1).
- D2 "manual" vs routing.md "manual selection". Resolved by D49.
- D11 owner = assignee vs routing.md reassignment. Resolved by D33.
- D14 built-ins vs D13 no-editing. Resolved by D36, D39.
- D10 vs cancel flow and developer-mode "Remove Review Request". Resolved by D25.
- D14 "per app" scope vs D15. Resolved by D35.

## Second pass: admin findings (2026-10-02)

A1. [D33, D34, D43, D48] No `workflows.editor` / `workflows.reassign` permissions exist; schema is `createPermissionSchema({prefix:"workflows", fullAccess:{editor:true}})` (`app-workflows/src/domain/permissionsSchema.ts:3-6`), API checks the `permission.editor` flag. Schema supports `entities[]` with custom boolean actions (`app-admin/src/permissions/types.ts:13-50`). Flags on one `workflows` permission, or separate permission names? What does custom access look like in Security UI?
A2. [D39] `AiSdkTools.getToolSet()` returns all tools (`api-core/src/features/ai/AiSdkTools.ts:14-31`); no list query; registered tools include admin-power ones (`createTeam`, `grantFolderAccess`…); no content-edit tools exist (CMS read-only, WB none). Needs list query, "workflow-safe" marker, filtered tool set, new target-scoped edit tools. Who builds edit tools, for which targets?
A3. [D14, D37] No JSON-schema form renderer. FormModel (`app-admin/src/features/formModel`) has field registry, object lists, dynamic zones, zod validation; zod 4 has `z.toJSONSchema` / `z.fromJSONSchema`. Build JSON-schema → FormModel adapter with UI hints in `.meta()`. Rebuild step editor on FormModel (dynamic zone per step type, `ObjectAccordionMultipleRenderer` for rules)?
A4. [D14, D36, D46] Secrets in automation config get snapshotted into the review and are readable. Masked, write-only, or stored outside the snapshot?
A5. [D13, D40] ai-powerups is a removable extension. Need a step-type extension point (API + admin) so ai-powerups contributes the AI step. New licence option (e.g. `aiPowerups.options.workflowReview`)?
A6. [D31] Collaboration resolvers keyed by `contentType`; only `cms.entry` exists; `workflow:<reviewId>:<stepId>` locator on `cms.entry` resolves as outdated field path; no locator filter; no WB resolver; author is always current identity (conflicts with D3/D30). Suggest `contentType: "workflow.review"`, `contentId = reviewId`, resolver checks review read access, post-as-actor support. Opportunity: post D39 `issues[].fieldPath` as field-anchored threads.
A7. [D6, D44, D36] In-app notifications are toast-only, no persistence; nothing refreshes open views when a task finishes or AI edits content. Websocket message should also trigger refetch / `WorkflowStateChangedEvent`. Inbox needed, or D47 lists suffice?
A8. [D46, D45] `FolderPicker` exists but folder listing is folder-level-permission filtered; editor without folder access cannot pick it and dangling-folder flag would misfire. Workflows-owned folder query without authorization, or require folder access? v2 folder condition needs folder type too.
A9. [D5, D25, D33] Client computes `canCancel` (contradicts D25). Compute `canCancel`, `canReassign`, `canPick` on the server with `canRestart`.
A10. [D29] Row selectability reads `system.workflow.state`; renamed by D29. Add a review status column/filter to CMS and WB lists, or only port the selectable rule?
A11. [D47] Dashboard widgets still "own"/"requested". Which widgets, which list does "View all" open?
A12. [D46, D22, D43] Team autocompletes list all teams (rule targets need step teams only). AutoComplete supports disabled items (fits excluded users). FormModel `AutoCompleteRenderer` is sync-only; searchable user picker needs a custom field type.
A13. [D43] `dateOnly()` returns a plain date; end-of-day-in-user-timezone conversion is custom work.

## Second pass: API findings (2026-10-02)

P1. [D29] Storage cannot filter on `system.workflow`: storage filter registry has no `system` field (`api-headless-cms-storage/src/filtering/fields/systemFields.ts:10-160`), DDB lists throw. Dead legacy `state` system field (`systemFields.ts:107-138`, OS `fields/state.ts`) written by nothing. Add `system.workflow` filterable fields (DDB + OS) or repurpose `state`, or drop "lists can filter".
P2. [D19, D29] `system.workflow` sync goes through `UpdateEntryUseCase`: checks write access (reviewer without write fails silently), rewrites `savedOn`/`modifiedBy` etc., fires `EntryAfterUpdate`/`PageAfterUpdate` (public webhooks, audit logs). Every transition looks like a content edit. Write via storage-level patch with no meta bump or events.
P3. [D33, D34] Permission system cannot express `reassign` yet; API accepts only `name === "*"` or `editor: true`, not `workflows.*`. Define custom actions and one shared permission checker.
P4. [D33] Nothing audits workflows; `common-audit-logs/src/apps.ts:43-79` still has the v5 "APW" app; CMS audit handlers skip private models; audit logs licence-gated. Needs a new workflows audit app + handlers, remove APW entry. Which actions are logged?
P5. [D39] No content-edit tools; registry includes security tools; assistant uses human approval for destructive tools, unattended AI step would not. Build target-scoped edit tools; allowlist only workflow-safe tools.
P6. [D40, D13] Capability and `ResolveAiCapabilityUseCase` live in ai-powerups (registered only under `aiPowerups`). Does ai-powerups register the capability and the AI step runner (dependency ai-powerups → api-workflows), or api-workflows optionally injects ai-powerups?
P7. [D28] Hooks only run inside the runner; on max iterations both `onMaxIterations` and `onError` fire (idempotent failed write). Standalone worker gives up after 24h, crash or restart runs no hook: step stuck. Default `maxIterations` 50. Let definitions set `maxIterations`/wait; add a "stuck" check on read (task status vs step state) or restart for a non-failed running step.
P8. [D24, D51] WB `PageBeforeCreateRevisionFrom` payload has no page. WB revisions go through CMS `CreateEntryRevisionFromUseCase`, whose `EntryRevisionBeforeCreate` entry is mutable. Use one CMS-level handler for all models. CMS-adapter handlers also see WB page events; adapters must match namespace and model explicitly.
P9. [D44] Websocket push reaches only live connections; nothing persisted. Accept (lists act as inbox) or persist notifications?
P10. [D21, D22, D46, D47] Team membership does not imply content read access; folder-permission filter hides reviews from assignees without folder access. Filter candidates by target read access during resolution, or reject such targets on rule save.
P11. [D36] No server-side save block exists; block is UI-only. Add API block (exempting automation and `system.workflow` sync) or accept UI-only?
P12. [D19, D20] DDB-only CMS lists scan the whole model partition. Per-candidate counts = K scans. Use one query `currentOwnerId_in` grouped in memory; add retention for `wbyWorkflowAssignment`.
P13. [D41] `ModelBeforeDelete` handlers must throw. Use a `DeleteModel` use-case decorator returning typed `Workflows/Model/BoundToWorkflow` error, like `DeleteModelWithEntryCleanup.ts:95-107`.
P14. [D7, D25, D50] `TaskService.abort` needs task id: run id = task id. `trigger` has no identity param; D50 "trigger as requester" needs an identity swap around `trigger` or a new option.
