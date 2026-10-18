# Phase 9a — user answers (2026-10-18)

Questions continue the 8b numbering (8b ended at Q40).

- Q41 Editor validation errors: the API adds error data. `Workflows/Workflow/Validation` carries `{ stepId, field }` (null when the error is about the whole workflow), and the duplicate-model error also carries `{ workflowId }` of the other workflow. The editor marks the step and the field, scrolls to it and shows the banner. The client still validates first; the server error is the fallback (R267).
- Q42 Reviewing teams: a new shared query `workflows { listTeams(search, ids, limit) }` returns `{ teams, missingIds }`, gated on `editor`. Only the team lookup runs under `withoutAuthorization`, and it exposes the id and name (the SEC-66 pattern of `listUsers` and `candidateTeams`). The planner later added `memberCount` to each team for the design's "{Team} has no members." warning (R268).
- Q43 Copy the design does not provide, accepted as proposed (R281):
  1. A step option list (step types, automations, notification channels, teams, AI models or tools) fails to load while the editor loaded: banner "Could not load the step options." with a "Try again" button.
  2. Conflict when the server gives no saver name: "Someone" in place of the name.
  3. Conflict dialog: the D131 text as is, with no time.
  4. A server validation error with no step or field: banner "Could not save the workflow — {server message}".
  5. A step whose saved transport id no longer exists: kept, unlisted, with no warning (D151).
- Q44 AI steps: the full AI step editor is built in 9a (instructions, the model picker with its empty, failed, no-model and retired-model states, tools, the licence warning). Phase 9c keeps the settings page and the permission UI only.
