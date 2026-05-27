# Background Tasks Admin UI — Handoff

## Branch

`bruno/feat/background-tasks-ui`

## What's done

A complete `@webiny/background-tasks` admin package:

- **6 features:** listTasks, getTask, deleteTask, abortTask, listLogs, listDefinitions
- **Permissions:** TaskPermissions feature, HasPermission component, usePermissions hook
- **TaskDefinitions:** Read-only DataTable of registered task definitions (title, id, description)
- **TaskExecutions:** DataTable with search, status/definition/date-range filters, sortable columns (name, definition, status, created, started, finished), abort/delete row actions with confirmation dialogs
- **TaskDetail:** 900px modal Drawer showing general info grid, input/output JSON (CodeEditor), paginated log entries with expandable data/error payloads
- **Registered** in `packages/app-serverless-cms/src/Admin.tsx`, two menu items under "Dev Tools"
- **Builds cleanly** — `yarn build -p @webiny/background-tasks` passes

## What's NOT done

- **Not tested in browser** — the UI compiles but hasn't been visually verified
- **API side is empty** — `src/api/index.ts` is a placeholder; the existing `@webiny/tasks` package provides the GraphQL API
- **No trigger UI** — users cannot trigger new tasks from the admin (by design, for now)

## Known risks / things to watch

1. **SDK type gap:** `TaskRun` from `@webiny/sdk` doesn't include `createdOn`, `savedOn`, `createdBy`. We extended the `Task` type locally in `src/admin/shared/types.ts`. If SDK types are updated, remove the local extension.

2. **GraphQL filter field names:** The `WebinyBackgroundTaskListWhereInput` is dynamically generated from CMS model fields. The filter keys used in the UI (`taskStatus_in`, `definitionId`, `createdOn_gte`, `createdOn_lte`) must match the actual generated input. If filters don't work, check the GraphQL schema in the running app via the playground.

3. **DatePicker component:** Requires `type="date"` prop. Input/Select don't support `size="sm"` — those were stripped during build fixes.

4. **Presenter pattern:** Actions are at the presenter root (`presenter.deleteTask()`, `presenter.search.set()`), NOT nested under `presenter.actions`. This is a project convention.

## Key files

| What                | Path                                                                                                  |
| ------------------- | ----------------------------------------------------------------------------------------------------- |
| Design spec         | `docs/superpowers/specs/2026-05-20-background-tasks-admin-ui-design.md`                               |
| Implementation plan | `docs/superpowers/plans/2026-05-20-background-tasks-admin-ui.md`                                      |
| Package root        | `packages/background-tasks/`                                                                          |
| Shared types        | `packages/background-tasks/src/admin/shared/types.ts`                                                 |
| Definitions view    | `packages/background-tasks/src/admin/presentation/TaskDefinitions/components/TaskDefinitionsView.tsx` |
| Executions view     | `packages/background-tasks/src/admin/presentation/TaskExecutions/components/TaskExecutionsView.tsx`   |
| Detail drawer       | `packages/background-tasks/src/admin/presentation/TaskDetail/components/TaskDetailDrawer.tsx`         |
| Main component      | `packages/background-tasks/src/admin/BackgroundTasks.tsx`                                             |
| Registration        | `packages/background-tasks/src/admin/BackgroundTaskRoutes.tsx`                                        |
| App integration     | `packages/app-serverless-cms/src/Admin.tsx`                                                           |

## Next steps

1. Run the admin app and navigate to `/background-tasks/definitions` and `/background-tasks/executions` — verify both views load
2. Test filters (status, definition, date range) work against the live GraphQL schema
3. Click a task row — verify the drawer opens with correct info, JSON, and logs
4. Test abort on a running task, delete on a completed/failed task
5. Verify permission gating — users without `task` permission should only see their own tasks
