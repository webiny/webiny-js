# Background Tasks Admin UI

## Overview

Admin UI for monitoring and managing background tasks in Webiny. Provides a list view with search, filtering, and pagination, plus a drawer-based detail view showing task info, input/output payloads, and execution logs.

## Package Structure

New package: `packages/background-tasks`

```
packages/background-tasks/
  package.json
  tsconfig.json
  tsconfig.build.json
  src/
    index.ts
    admin/
      index.ts
      routes.ts
      BackgroundTasks.tsx
      BackgroundTaskRoutes.tsx
      permissions.ts
      features/
        listTasks/
        getTask/
        deleteTask/
        abortTask/
        listLogs/
        listDefinitions/
      presentation/
        TaskList/
        TaskDetail/
      shared/
    api/
      index.ts
```

- Follows the same structure as `packages/webhooks`.
- `api/index.ts` is an empty placeholder for now.
- Admin entry point exports `BackgroundTasks` component and `Routes`.
- Menu item registered under `dev-tools` parent.

## Dependencies

- `@webiny/admin-ui` — DataTable, Drawer, Tag, TimeAgo, CodeEditor, Grid, Button, DropdownMenu, Select, DatePicker
- `@webiny/app` — DI container, feature resolution
- `@webiny/app-admin` — ListPresenter, useSnackbar, useConfirmationDialog, useRouter
- `@webiny/feature` — createAbstraction, createFeature
- `@webiny/sdk` — GraphQL client methods (listTasks, listLogs, listDefinitions, abortTask, deleteTask)
- `mobx` / `mobx-react-lite` — reactive state management
- `react`, `react-dom`

## Permissions

Permission schema: `task` entity with `rwd` actions (read, write, delete).

Users without the `task` permission can only see tasks where `createdBy` matches their identity. This filtering is applied at the gateway level before sending the GraphQL query.

## List View

Route: `/background-tasks`

### Columns

| Column | Field | Renderer | Sortable |
|--------|-------|----------|----------|
| Name | `name` | Clickable text (opens drawer) | Yes |
| Definition | `definitionId` | Plain text (resolved to definition title) | Yes |
| Status | `taskStatus` | Tag component | Yes |
| Created | `createdOn` | TimeAgo | Yes |
| Started | `startedOn` | TimeAgo | Yes |
| Finished | `finishedOn` | TimeAgo | Yes |

### Status Tag Variants

| Status | Tag Variant |
|--------|-------------|
| pending | neutral-light |
| running | accent |
| success | success |
| failed | destructive |
| aborted | warning |

### Filters

- **Text search** on task name.
- **Status** — multi-select dropdown (pending, running, success, failed, aborted).
- **Definition** — dropdown populated from `listDefinitions` query.
- **Date range** — date picker for `createdOn`.

### Row Actions (DropdownMenu)

- **Abort** — visible only when `taskStatus` is `running`. Behind confirmation dialog.
- **Delete** — visible when `taskStatus` is `success`, `failed`, or `aborted`. Behind confirmation dialog.

### Pagination

Cursor-based (load more), using the `ListPresenter` pattern from `@webiny/app-admin`.

## Detail View (Drawer)

Opens on row click. Width: `900px`. Closable via close button.

### Header

- Task name as title.
- Status Tag next to the title.
- Action buttons: Abort (if running), Delete (if terminal state).

### General Info Section

Grid layout, 2 columns:

| Left | Right |
|------|-------|
| Definition | Created By |
| Created On | Started On |
| Finished On | Iterations |

### Input/Output Section

Two read-only CodeEditor components (`language: "json"`):
- **Input** — task input payload. Hidden if empty.
- **Output** — task output payload. Hidden if empty.

### Logs Section

Heading: "Logs". Most recent entries first.

Each log entry displays:
- Timestamp (TimeAgo)
- Type badge: Tag — `info` (neutral-light) or `error` (destructive)
- Message text
- Expandable data/error JSON (CodeEditor, collapsed by default)

Logs fetched via `listLogs` filtered by task ID. Cursor-based pagination (load more) for large log sets.

## Features (Admin)

Each feature follows the 4-layer pattern: abstractions → feature registration → usecase → repository → gateway.

### listTasks

- **Input:** search, filters (status, definitionId, createdOn range), sort, limit, after cursor
- **Output:** list of tasks, pagination metadata (hasMoreItems, totalCount, cursor)
- **Gateway:** calls `backgroundTasks.listTasks` GraphQL query via `MainGraphQLClient`

### getTask

- **Input:** task ID
- **Output:** single task record
- **Gateway:** calls `backgroundTasks.getTask` GraphQL query

### deleteTask

- **Input:** task ID
- **Output:** success/error
- **Gateway:** calls `backgroundTasks.deleteTask` GraphQL mutation

### abortTask

- **Input:** task ID, optional message
- **Output:** updated task record
- **Gateway:** calls `backgroundTasks.abortTask` GraphQL mutation

### listLogs

- **Input:** task ID filter, sort, limit, after cursor
- **Output:** list of log entries, pagination metadata
- **Gateway:** calls `backgroundTasks.listLogs` GraphQL query

### listDefinitions

- **Input:** none
- **Output:** list of task definitions (id, title, description)
- **Gateway:** calls `backgroundTasks.listDefinitions` GraphQL query

## Presentation (Admin)

### TaskList

- **Presenter:** `TaskListPresenter` — wraps `ListPresenter` with task-specific data source, composes `ListTasksUseCase`, `DeleteTaskUseCase`, `AbortTaskUseCase`, `ListDefinitionsUseCase`, and permissions.
- **DataSource:** `TaskListDataSource` implementing `IDataSource<Task>`.
- **Component:** `TaskListView` — observer component using DataTable, filters, row actions.

### TaskDetail

- **Presenter:** `TaskDetailPresenter` — manages selected task state, loads logs, handles abort/delete actions. Composes `GetTaskUseCase`, `ListLogsUseCase`, `AbortTaskUseCase`, `DeleteTaskUseCase`.
- **Component:** `TaskDetailDrawer` — Drawer component rendering general info, input/output CodeEditors, and logs list.

## Data Flow

```
TaskListView (React + observer)
  → TaskListPresenter (MobX)
    → TaskListDataSource
      → ListTasksUseCase
        → ListTasksRepository
          → ListTasksGateway
            → GraphQL (backgroundTasks.listTasks)
```

```
TaskDetailDrawer (React + observer)
  → TaskDetailPresenter (MobX)
    → GetTaskUseCase → GetTaskGateway → GraphQL
    → ListLogsUseCase → ListLogsGateway → GraphQL
    → AbortTaskUseCase → AbortTaskGateway → GraphQL
    → DeleteTaskUseCase → DeleteTaskGateway → GraphQL
```
