# Background Tasks Admin UI Redesign

## Summary

Split the current single-page background tasks admin UI into two separate views under Dev Tools:

1. **Task Definitions** — read-only list of registered task definitions
2. **Task Executions** — list of executed tasks with detail drawer (logs, input, output)

No trigger UI, no field builder, no API-side changes. Frontend restructure only.

## Routes & Menu

Both views live under the existing **Dev Tools** menu parent:

- `Dev Tools > Task Definitions` at `/background-tasks/definitions`
- `Dev Tools > Task Executions` at `/background-tasks/executions`

## Task Definitions View

Simple DataTable listing all registered (non-private) task definitions.

**Data source:** existing `ListDefinitionsUseCase` (GraphQL `backgroundTasks.listDefinitions`).

**Columns:** Title (or ID if no title), Description.

**Behavior:**
- Loads once on mount.
- No pagination, search, or filtering (definitions are a small static set).
- Uses a proper presenter (`TaskDefinitionsPresenter`) for consistency with project patterns.

**Presenter VM shape:**
- `definitions: TaskDefinition[]`
- `loading: boolean`

## Task Executions View

The current `TaskListView` + `TaskDetailDrawer`, relocated to a new route. No functional changes.

**Data source:** existing `ListTasksUseCase` with pagination, search, sort, filters.

**Columns:** Name, Definition, Status, Created, Started, Finished, Actions.

**Filters:** Search text, status, definition, created date range.

**Actions:** Abort (if running), Delete (if terminal).

**Detail drawer:** Opens on row click. Shows general info, input JSON, output JSON, paginated logs. Unchanged from current implementation.

**Presenter:** renamed from `TaskListPresenter` to `TaskExecutionsPresenter`. Same logic.

## File Layout

```
src/admin/
├── BackgroundTasks.tsx              # registers all features (unchanged logic)
├── BackgroundTaskRoutes.tsx         # two routes + two menu items
├── routes.ts                        # Definitions + Executions route objects
├── permissions.ts                   # unchanged
├── shared/types.ts                  # unchanged
│
├── features/                        # ALL UNCHANGED
│   ├── listTasks/
│   ├── getTask/
│   ├── deleteTask/
│   ├── abortTask/
│   ├── listLogs/
│   ├── listDefinitions/
│   └── permissions/
│
└── presentation/
    ├── TaskDefinitions/             # NEW
    │   ├── abstractions.ts
    │   ├── TaskDefinitionsPresenter.ts
    │   ├── feature.ts
    │   └── components/
    │       └── TaskDefinitionsView.tsx
    │
    ├── TaskExecutions/              # RENAMED from TaskList
    │   ├── abstractions.ts
    │   ├── TaskExecutionsPresenter.ts
    │   ├── TaskExecutionsDataSource.ts
    │   ├── feature.ts
    │   └── components/
    │       └── TaskExecutionsView.tsx
    │
    ├── TaskDetail/                  # UNCHANGED
    │   ├── abstractions.ts
    │   ├── TaskDetailPresenter.ts
    │   ├── TaskDetailDataSource.ts
    │   ├── feature.ts
    │   └── components/
    │       └── TaskDetailDrawer.tsx
    │
    └── security/                    # UNCHANGED
        ├── HasPermission.tsx
        └── usePermissions.ts
```

## Changes Summary

| Area | Change |
|------|--------|
| `routes.ts` | Add `Definitions` and `Executions` route objects, remove old `List` route |
| `BackgroundTaskRoutes.tsx` | Two menu items, two `<Route>` entries |
| `BackgroundTasks.tsx` | Register new `TaskDefinitionsPresenterFeature`, rename task list feature |
| `presentation/TaskDefinitions/` | New presenter + view for definitions list |
| `presentation/TaskList/` | Renamed to `TaskExecutions/`, all files renamed accordingly |
| `presentation/TaskDetail/` | Unchanged |
| `features/*` | Unchanged |
| `permissions.ts` | Unchanged |

## Out of Scope

- Trigger task UI (run a task from definitions view)
- Field builder / input schema on definitions
- API-side changes
- New GraphQL queries or mutations
