# Background Tasks Admin UI Redesign — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Split the single background-tasks admin page into two views — Task Definitions (read-only list) and Task Executions (existing list + detail drawer) — both under Dev Tools.

**Architecture:** Rename the existing `TaskList` presentation folder to `TaskExecutions`. Create a new `TaskDefinitions` presentation folder with its own presenter, feature, and view. Update routes and menu to expose both views.

**Tech Stack:** React, MobX, Webiny admin DI (`createAbstraction`, `createImplementation`, `createFeature`), `@webiny/admin-ui` components.

---

## File Map

| Action | Path | Responsibility |
|--------|------|----------------|
| Modify | `src/admin/routes.ts` | Two route objects: `Definitions`, `Executions` |
| Modify | `src/admin/BackgroundTaskRoutes.tsx` | Two menu items + two `<Route>` entries |
| Modify | `src/admin/BackgroundTasks.tsx` | Register new `TaskDefinitionsPresenterFeature`, rename task list import |
| Modify | `src/admin/index.ts` | Update exports |
| Create | `src/admin/presentation/TaskDefinitions/abstractions.ts` | `ITaskDefinitionsPresenter`, `ITaskDefinitionsViewModel` |
| Create | `src/admin/presentation/TaskDefinitions/TaskDefinitionsPresenter.ts` | MobX presenter: loads definitions, exposes `vm` |
| Create | `src/admin/presentation/TaskDefinitions/feature.ts` | DI registration |
| Create | `src/admin/presentation/TaskDefinitions/index.ts` | Public exports |
| Create | `src/admin/presentation/TaskDefinitions/components/TaskDefinitionsView.tsx` | DataTable of definitions |
| Rename | `src/admin/presentation/TaskList/` → `src/admin/presentation/TaskExecutions/` | All files renamed |
| Modify | `src/admin/presentation/TaskExecutions/abstractions.ts` | Rename types: `TaskExecutionsPresenter`, `ITaskExecutionsPresenter`, `ITaskExecutionsViewModel` |
| Modify | `src/admin/presentation/TaskExecutions/TaskExecutionsPresenter.ts` | Rename class + export |
| Rename | `src/admin/presentation/TaskExecutions/TaskExecutionsDataSource.ts` | Rename from `TaskListDataSource` |
| Modify | `src/admin/presentation/TaskExecutions/feature.ts` | Rename feature name + imports |
| Modify | `src/admin/presentation/TaskExecutions/index.ts` | Update exports |
| Modify | `src/admin/presentation/TaskExecutions/components/TaskExecutionsView.tsx` | Rename from `TaskListView`, update heading text |

---

### Task 1: Rename TaskList to TaskExecutions

Rename the existing `presentation/TaskList/` folder and all internal references to use `TaskExecutions` naming.

**Files:**
- Rename: `src/admin/presentation/TaskList/` → `src/admin/presentation/TaskExecutions/`
- Modify: all files inside the renamed folder

- [ ] **Step 1: Rename the folder**

```bash
cd packages/background-tasks
mv src/admin/presentation/TaskList src/admin/presentation/TaskExecutions
```

- [ ] **Step 2: Rename `TaskListDataSource.ts` → `TaskExecutionsDataSource.ts`**

```bash
cd packages/background-tasks
mv src/admin/presentation/TaskExecutions/TaskListDataSource.ts src/admin/presentation/TaskExecutions/TaskExecutionsDataSource.ts
```

- [ ] **Step 3: Rename `TaskListPresenter.ts` → `TaskExecutionsPresenter.ts`**

```bash
cd packages/background-tasks
mv src/admin/presentation/TaskExecutions/TaskListPresenter.ts src/admin/presentation/TaskExecutions/TaskExecutionsPresenter.ts
```

- [ ] **Step 4: Rename view component directory file**

```bash
cd packages/background-tasks
mv src/admin/presentation/TaskExecutions/components/TaskListView.tsx src/admin/presentation/TaskExecutions/components/TaskExecutionsView.tsx
```

- [ ] **Step 5: Update `abstractions.ts`**

Replace the full contents of `src/admin/presentation/TaskExecutions/abstractions.ts` with:

```typescript
import { createAbstraction } from "@webiny/feature/admin";
import type { Task } from "~/admin/shared/types.js";
import type { IListViewModel } from "@webiny/app-admin/presentation/listPresenter/abstractions.js";
import type { IListActions } from "@webiny/app-admin/presentation/listPresenter/abstractions.js";

export interface ITaskExecutionsViewModel {
    list: IListViewModel<Task>;
    permissions: {
        canRead: boolean;
        canDelete: boolean;
    };
}

export interface ITaskExecutionsPresenter extends IListActions {
    vm: ITaskExecutionsViewModel;
    selectedTask: Task | null;
    deleteTask(id: string): Promise<void>;
    abortTask(id: string): Promise<void>;
    selectTask(task: Task | null): void;
    init(): void;
}

export const TaskExecutionsPresenter = createAbstraction<ITaskExecutionsPresenter>("TaskExecutionsPresenter");

export namespace TaskExecutionsPresenter {
    export type Interface = ITaskExecutionsPresenter;
    export type ViewModel = ITaskExecutionsViewModel;
}
```

- [ ] **Step 6: Update `TaskExecutionsDataSource.ts`**

The file was renamed in Step 2. No content changes needed — the class name `TaskListDataSource` is fine as an internal implementation detail, but for consistency rename it. Replace full contents of `src/admin/presentation/TaskExecutions/TaskExecutionsDataSource.ts` with:

```typescript
import { makeAutoObservable, runInAction, computed } from "mobx";
import type {
    IDataSource,
    IDataSourceQuery,
    IDataSourceMeta
} from "@webiny/app-admin/presentation/listPresenter/abstractions.js";
import type { Task } from "~/admin/shared/types.js";
import type { IListTasksUseCase } from "~/admin/features/listTasks/abstractions.js";

const ENTRY_META_SORT_FIELDS = new Set([
    "id",
    "createdOn",
    "modifiedOn",
    "savedOn",
    "deletedOn",
    "restoredOn",
    "firstPublishedOn",
    "lastPublishedOn"
]);

function toSortEnum(field: string, direction: "ASC" | "DESC"): string {
    const prefix = ENTRY_META_SORT_FIELDS.has(field) ? "" : "values_";
    return `${prefix}${field}_${direction}`;
}

export class TaskExecutionsDataSource implements IDataSource<Task> {
    private _rows: Task[] = [];
    private _meta: IDataSourceMeta = { cursor: null, hasMoreItems: false, totalCount: 0 };
    private _loading = false;

    constructor(private readonly listTasksUseCase: IListTasksUseCase) {
        makeAutoObservable<TaskExecutionsDataSource, "listTasksUseCase">(this, {
            listTasksUseCase: false,
            rows: computed
        });
    }

    get rows(): Task[] {
        return this._rows;
    }

    get meta(): IDataSourceMeta {
        return this._meta;
    }

    get loading(): boolean {
        return this._loading;
    }

    async query(params: IDataSourceQuery): Promise<void> {
        this._loading = true;
        const sort = params.sort
            ? [toSortEnum(params.sort.field, params.sort.direction)]
            : undefined;
        const result = await this.listTasksUseCase.execute({
            where: params.filters as Record<string, unknown> | undefined,
            sort,
            limit: params.limit,
            after: params.cursor,
            search: params.search
        });
        runInAction(() => {
            this._rows = result.items;
            this._meta = {
                cursor: result.meta.cursor,
                hasMoreItems: result.meta.hasMoreItems,
                totalCount: result.meta.totalCount
            };
            this._loading = false;
        });
    }

    async loadMore(params: IDataSourceQuery): Promise<void> {
        if (!this._meta.hasMoreItems || this._loading) {
            return;
        }
        this._loading = true;
        const sort = params.sort
            ? [toSortEnum(params.sort.field, params.sort.direction)]
            : undefined;
        const result = await this.listTasksUseCase.execute({
            where: params.filters as Record<string, unknown> | undefined,
            sort,
            limit: params.limit,
            after: this._meta.cursor ?? undefined,
            search: params.search
        });
        runInAction(() => {
            this._rows = [...this._rows, ...result.items];
            this._meta = {
                cursor: result.meta.cursor,
                hasMoreItems: result.meta.hasMoreItems,
                totalCount: result.meta.totalCount
            };
            this._loading = false;
        });
    }
}
```

- [ ] **Step 7: Update `TaskExecutionsPresenter.ts`**

Replace full contents of `src/admin/presentation/TaskExecutions/TaskExecutionsPresenter.ts` with:

```typescript
import { makeAutoObservable, computed } from "mobx";
import { ListPresenter } from "@webiny/app-admin/presentation/listPresenter/abstractions.js";
import type { Task } from "~/admin/shared/types.js";
import {
    TaskExecutionsPresenter as Abstraction,
    type ITaskExecutionsPresenter,
    type ITaskExecutionsViewModel
} from "./abstractions.js";
import { TaskExecutionsDataSource } from "./TaskExecutionsDataSource.js";
import { ListTasksUseCase } from "~/admin/features/listTasks/abstractions.js";
import { DeleteTaskUseCase } from "~/admin/features/deleteTask/abstractions.js";
import { AbortTaskUseCase } from "~/admin/features/abortTask/abstractions.js";
import { TaskPermissions } from "~/admin/features/permissions/abstractions.js";

class TaskExecutionsPresenterImpl implements ITaskExecutionsPresenter {
    private _selectedTask: Task | null = null;

    constructor(
        private readonly listPresenter: ListPresenter.Interface<Task>,
        private readonly listTasksUseCase: ListTasksUseCase.Interface,
        private readonly deleteTaskUseCase: DeleteTaskUseCase.Interface,
        private readonly abortTaskUseCase: AbortTaskUseCase.Interface,
        private readonly permissions: TaskPermissions.Interface
    ) {
        makeAutoObservable(this, { vm: computed });
    }

    get vm(): ITaskExecutionsViewModel {
        return {
            list: this.listPresenter.vm,
            permissions: {
                canRead: this.permissions.canRead("task"),
                canDelete: this.permissions.canDelete("task")
            }
        };
    }

    get selectedTask(): Task | null {
        return this._selectedTask;
    }

    search = {
        set: (query: string) => this.listPresenter.actions.search.set(query),
        clear: () => this.listPresenter.actions.search.clear()
    };

    sort = {
        set: (field: string, direction: "ASC" | "DESC") =>
            this.listPresenter.actions.sort.set(field, direction),
        toggle: (field: string) => this.listPresenter.actions.sort.toggle(field)
    };

    filter = {
        set: (key: string, value: unknown) => this.listPresenter.actions.filter.set(key, value),
        clear: (key: string) => this.listPresenter.actions.filter.clear(key),
        clearAll: () => this.listPresenter.actions.filter.clearAll()
    };

    selection = {
        toggle: (id: string) => this.listPresenter.actions.selection.toggle(id),
        selectRangeTo: (id: string) => this.listPresenter.actions.selection.selectRangeTo(id),
        selectAll: () => this.listPresenter.actions.selection.selectAll(),
        deselectAll: () => this.listPresenter.actions.selection.deselectAll(),
        selectRows: (ids: string[]) => this.listPresenter.actions.selection.selectRows(ids),
        isSelected: (id: string) => this.listPresenter.actions.selection.isSelected(id)
    };

    loadMore = () => this.listPresenter.actions.loadMore();
    refresh = () => this.listPresenter.actions.refresh();

    deleteTask = async (id: string) => {
        await this.deleteTaskUseCase.execute(id);
        this._selectedTask = null;
        await this.listPresenter.actions.refresh();
    };

    abortTask = async (id: string) => {
        await this.abortTaskUseCase.execute({ id });
        await this.listPresenter.actions.refresh();
    };

    selectTask = (task: Task | null) => {
        this._selectedTask = task;
    };

    init(): void {
        const dataSource = new TaskExecutionsDataSource(this.listTasksUseCase);
        this.listPresenter.init({
            dataSource,
            initialSort: { field: "createdOn", direction: "DESC" },
            limit: 20
        });
    }
}

export const TaskExecutionsPresenter = Abstraction.createImplementation({
    implementation: TaskExecutionsPresenterImpl,
    dependencies: [
        ListPresenter,
        ListTasksUseCase,
        DeleteTaskUseCase,
        AbortTaskUseCase,
        TaskPermissions
    ]
});
```

- [ ] **Step 8: Update `feature.ts`**

Replace full contents of `src/admin/presentation/TaskExecutions/feature.ts` with:

```typescript
import { createFeature } from "@webiny/feature/admin";
import { TaskExecutionsPresenter as PresenterAbstraction } from "./abstractions.js";
import { TaskExecutionsPresenter } from "./TaskExecutionsPresenter.js";

export const TaskExecutionsPresenterFeature = createFeature({
    name: "BackgroundTasks/TaskExecutionsPresenter",
    register(container) {
        container.register(TaskExecutionsPresenter).inSingletonScope();
    },
    resolve(container) {
        return { presenter: container.resolve(PresenterAbstraction) };
    }
});
```

- [ ] **Step 9: Update `index.ts`**

Replace full contents of `src/admin/presentation/TaskExecutions/index.ts` with:

```typescript
export { TaskExecutionsPresenter } from "./abstractions.js";
export { TaskExecutionsPresenterFeature } from "./feature.js";
```

- [ ] **Step 10: Update `TaskExecutionsView.tsx`**

Replace full contents of `src/admin/presentation/TaskExecutions/components/TaskExecutionsView.tsx` with:

```typescript
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { observer } from "mobx-react-lite";
import { DiContainerProvider, useContainer, useFeature } from "@webiny/app";
import type { DataTableSorting, OnDataTableSortingChange } from "@webiny/admin-ui";
import {
    Button,
    DataTable,
    DatePicker,
    DropdownMenu,
    Heading,
    IconButton,
    Input,
    Select,
    Separator,
    Tag,
    Text,
    TimeAgo
} from "@webiny/admin-ui";
import { useConfirmationDialog, useSnackbar } from "@webiny/app-admin/hooks/index.js";
import { ReactComponent as MoreVerticalIcon } from "@webiny/icons/more_vert.svg";
import { ReactComponent as DeleteIcon } from "@webiny/icons/delete.svg";
import { ReactComponent as StopCircleIcon } from "@webiny/icons/stop_circle.svg";
import { TaskExecutionsPresenterFeature } from "../feature.js";
import { ListTasksFeature } from "~/admin/features/listTasks/feature.js";
import { DeleteTaskFeature } from "~/admin/features/deleteTask/feature.js";
import { AbortTaskFeature } from "~/admin/features/abortTask/feature.js";
import { ListDefinitionsFeature } from "~/admin/features/listDefinitions/feature.js";
import { TaskPermissionsFeature } from "~/admin/features/permissions/feature.js";
import type { Task } from "~/admin/shared/types.js";
import type { TaskStatus } from "~/admin/shared/types.js";
import { TaskDetailDrawer } from "~/admin/presentation/TaskDetail/components/TaskDetailDrawer.js";

const STATUS_TAG_VARIANT: Record<
    string,
    "neutral-light" | "accent" | "success" | "destructive" | "warning"
> = {
    pending: "neutral-light",
    running: "accent",
    success: "success",
    failed: "destructive",
    aborted: "warning"
};

const STATUS_OPTIONS: { label: string; value: TaskStatus }[] = [
    { label: "Pending", value: "pending" },
    { label: "Running", value: "running" },
    { label: "Success", value: "success" },
    { label: "Failed", value: "failed" },
    { label: "Aborted", value: "aborted" }
];

const TaskExecutionsViewInner = observer(function TaskExecutionsViewInner() {
    const { presenter } = useFeature(TaskExecutionsPresenterFeature);
    const [definitions, setDefinitions] = useState<{ label: string; value: string }[]>([]);
    const { showSnackbar } = useSnackbar();

    useEffect(() => {
        presenter.init();
    }, [presenter]);

    const listDefinitionsFeature = useFeature(ListDefinitionsFeature);

    useEffect(() => {
        void listDefinitionsFeature.useCase.execute().then(defs => {
            setDefinitions(defs.map(d => ({ label: d.title, value: d.id })));
        });
    }, [listDefinitionsFeature]);

    const { vm } = presenter;

    const { showConfirmation: showDeleteConfirmation } = useConfirmationDialog({
        title: "Delete Task",
        message: "Are you sure you want to delete this task?"
    });

    const { showConfirmation: showAbortConfirmation } = useConfirmationDialog({
        title: "Abort Task",
        message: "Are you sure you want to abort this running task?"
    });

    const sorting: DataTableSorting = useMemo(() => {
        const sort = vm.list.sort;
        if (!sort || !sort.field) {
            return [];
        }
        return [{ id: sort.field, desc: sort.direction === "DESC" }];
    }, [vm.list.sort]);

    const onSortingChange: OnDataTableSortingChange = useCallback(
        updater => {
            const next = typeof updater === "function" ? updater(sorting) : updater;
            if (next.length > 0) {
                const { id, desc } = next[0];
                presenter.sort.set(id, desc ? "DESC" : "ASC");
            }
        },
        [sorting, presenter.sort]
    );

    const columns = useMemo(
        () => ({
            name: {
                header: "Name",
                cell: (row: Task) => (
                    <Text
                        className="cursor-pointer text-primary hover:underline"
                        onClick={() => presenter.selectTask(row)}
                    >
                        {row.name || row.definitionId}
                    </Text>
                ),
                enableSorting: true,
                size: 200
            },
            definitionId: {
                header: "Definition",
                cell: (row: Task) => {
                    const def = definitions.find(d => d.value === row.definitionId);
                    return <Text size="sm">{def ? def.label : row.definitionId}</Text>;
                },
                enableSorting: true,
                size: 160
            },
            taskStatus: {
                header: "Status",
                cell: (row: Task) => (
                    <Tag
                        variant={STATUS_TAG_VARIANT[row.taskStatus] ?? "neutral-light"}
                        content={row.taskStatus}
                    />
                ),
                enableSorting: true,
                size: 100
            },
            createdOn: {
                header: "Created",
                cell: (row: Task) =>
                    row.createdOn ? <TimeAgo datetime={row.createdOn} /> : <Text size="sm">—</Text>,
                enableSorting: true,
                size: 120
            },
            startedOn: {
                header: "Started",
                cell: (row: Task) =>
                    row.startedOn ? <TimeAgo datetime={row.startedOn} /> : <Text size="sm">—</Text>,
                enableSorting: true,
                size: 120
            },
            finishedOn: {
                header: "Finished",
                cell: (row: Task) =>
                    row.finishedOn ? (
                        <TimeAgo datetime={row.finishedOn} />
                    ) : (
                        <Text size="sm">—</Text>
                    ),
                enableSorting: true,
                size: 120
            },
            actions: {
                header: " ",
                cell: (row: Task) => {
                    const isRunning = row.taskStatus === "running";
                    const isTerminal =
                        row.taskStatus === "success" ||
                        row.taskStatus === "failed" ||
                        row.taskStatus === "aborted";

                    if (!isRunning && !isTerminal) {
                        return null;
                    }

                    return (
                        <DropdownMenu
                            trigger={
                                <IconButton
                                    icon={<MoreVerticalIcon />}
                                    variant="ghost"
                                    size="sm"
                                    aria-label="Actions"
                                />
                            }
                        >
                            {isRunning && (
                                <DropdownMenu.Item
                                    icon={<StopCircleIcon />}
                                    onClick={() => {
                                        showAbortConfirmation(() =>
                                            presenter.abortTask(row.id).then(() => {
                                                showSnackbar("Task aborted.");
                                            })
                                        );
                                    }}
                                    text="Abort"
                                />
                            )}
                            {isTerminal && vm.permissions.canDelete && (
                                <>
                                    {isRunning && <DropdownMenu.Separator />}
                                    <DropdownMenu.Item
                                        icon={<DeleteIcon />}
                                        onClick={() => {
                                            showDeleteConfirmation(() =>
                                                presenter.deleteTask(row.id).then(() => {
                                                    showSnackbar("Task deleted.");
                                                })
                                            );
                                        }}
                                        text="Delete"
                                    />
                                </>
                            )}
                        </DropdownMenu>
                    );
                },
                size: 56,
                enableSorting: false,
                enableHiding: false,
                enableResizing: false
            }
        }),
        [
            vm.permissions,
            presenter,
            definitions,
            showDeleteConfirmation,
            showAbortConfirmation,
            showSnackbar
        ]
    );

    return (
        <>
            <div className="flex flex-col h-main-content">
                <div className="flex items-center justify-between py-sm px-md">
                    <Heading level={5}>Task Executions</Heading>
                </div>
                <Separator />
                <div className="flex items-center gap-sm px-md py-xs flex-wrap">
                    <div className="w-[240px]">
                        <Input
                            placeholder="Search by name..."
                            value={vm.list.search}
                            onChange={e => presenter.search.set(e.target.value)}
                        />
                    </div>
                    <div className="w-[160px]">
                        <Select
                            placeholder="Status"
                            options={STATUS_OPTIONS}
                            value={(vm.list.filters.taskStatus_in as string) ?? ""}
                            onChange={value => {
                                if (value) {
                                    presenter.filter.set("taskStatus_in", value);
                                } else {
                                    presenter.filter.clear("taskStatus_in");
                                }
                            }}
                        />
                    </div>
                    {definitions.length > 0 && (
                        <div className="w-[200px]">
                            <Select
                                placeholder="Definition"
                                options={definitions}
                                value={(vm.list.filters.definitionId as string) ?? ""}
                                onChange={value => {
                                    if (value) {
                                        presenter.filter.set("definitionId", value);
                                    } else {
                                        presenter.filter.clear("definitionId");
                                    }
                                }}
                            />
                        </div>
                    )}
                    <div className="w-[160px]">
                        <DatePicker
                            type="date"
                            placeholder="Created from"
                            value={(vm.list.filters.createdOn_gte as string) ?? ""}
                            onChange={value => {
                                if (value) {
                                    presenter.filter.set("createdOn_gte", value);
                                } else {
                                    presenter.filter.clear("createdOn_gte");
                                }
                            }}
                        />
                    </div>
                    <div className="w-[160px]">
                        <DatePicker
                            type="date"
                            placeholder="Created to"
                            value={(vm.list.filters.createdOn_lte as string) ?? ""}
                            onChange={value => {
                                if (value) {
                                    presenter.filter.set("createdOn_lte", value);
                                } else {
                                    presenter.filter.clear("createdOn_lte");
                                }
                            }}
                        />
                    </div>
                    {Object.keys(vm.list.filters).length > 0 && (
                        <Button
                            variant="tertiary"
                            size="sm"
                            onClick={() => presenter.filter.clearAll()}
                        >
                            Clear filters
                        </Button>
                    )}
                </div>
                <Separator />
                <div className="flex-1 overflow-auto">
                    {!vm.list.pagination.loading && vm.list.rows.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full gap-md">
                            <Text className="text-neutral-strong">No tasks found.</Text>
                        </div>
                    ) : (
                        <DataTable<Task>
                            columns={columns}
                            data={vm.list.rows}
                            loading={vm.list.pagination.loading}
                            sorting={sorting}
                            onSortingChange={onSortingChange}
                            stickyHeader
                        />
                    )}
                </div>
            </div>
            {presenter.selectedTask && (
                <TaskDetailDrawer
                    task={presenter.selectedTask}
                    open={!!presenter.selectedTask}
                    onClose={() => presenter.selectTask(null)}
                    onAbort={async (id: string) => {
                        await presenter.abortTask(id);
                        showSnackbar("Task aborted.");
                    }}
                    onDelete={async (id: string) => {
                        await presenter.deleteTask(id);
                        showSnackbar("Task deleted.");
                    }}
                />
            )}
        </>
    );
});

export const TaskExecutionsView = () => {
    const container = useContainer();

    const scopedContainer = useMemo(() => {
        const child = container.createChildContainer();
        ListTasksFeature.register(child);
        DeleteTaskFeature.register(child);
        AbortTaskFeature.register(child);
        ListDefinitionsFeature.register(child);
        TaskPermissionsFeature.register(child);
        TaskExecutionsPresenterFeature.register(child);
        return child;
    }, []);

    return (
        <DiContainerProvider container={scopedContainer}>
            <TaskExecutionsViewInner />
        </DiContainerProvider>
    );
};
```

- [ ] **Step 11: Commit**

```bash
git add .
git commit -m "refactor(background-tasks): rename TaskList to TaskExecutions"
```

---

### Task 2: Create TaskDefinitions Presenter

Create the new presenter that loads task definitions and exposes them via a view model.

**Files:**
- Create: `src/admin/presentation/TaskDefinitions/abstractions.ts`
- Create: `src/admin/presentation/TaskDefinitions/TaskDefinitionsPresenter.ts`
- Create: `src/admin/presentation/TaskDefinitions/feature.ts`
- Create: `src/admin/presentation/TaskDefinitions/index.ts`

- [ ] **Step 1: Create `abstractions.ts`**

Create `src/admin/presentation/TaskDefinitions/abstractions.ts`:

```typescript
import { createAbstraction } from "@webiny/feature/admin";
import type { TaskDefinition } from "~/admin/shared/types.js";

export interface ITaskDefinitionsViewModel {
    definitions: TaskDefinition[];
    loading: boolean;
}

export interface ITaskDefinitionsPresenter {
    vm: ITaskDefinitionsViewModel;
    init(): void;
}

export const TaskDefinitionsPresenter = createAbstraction<ITaskDefinitionsPresenter>("TaskDefinitionsPresenter");

export namespace TaskDefinitionsPresenter {
    export type Interface = ITaskDefinitionsPresenter;
    export type ViewModel = ITaskDefinitionsViewModel;
}
```

- [ ] **Step 2: Create `TaskDefinitionsPresenter.ts`**

Create `src/admin/presentation/TaskDefinitions/TaskDefinitionsPresenter.ts`:

```typescript
import { makeAutoObservable, runInAction, computed } from "mobx";
import {
    TaskDefinitionsPresenter as Abstraction,
    type ITaskDefinitionsPresenter,
    type ITaskDefinitionsViewModel
} from "./abstractions.js";
import { ListDefinitionsUseCase } from "~/admin/features/listDefinitions/abstractions.js";
import type { TaskDefinition } from "~/admin/shared/types.js";

class TaskDefinitionsPresenterImpl implements ITaskDefinitionsPresenter {
    private _definitions: TaskDefinition[] = [];
    private _loading = false;

    constructor(
        private readonly listDefinitionsUseCase: ListDefinitionsUseCase.Interface
    ) {
        makeAutoObservable(this, { vm: computed });
    }

    get vm(): ITaskDefinitionsViewModel {
        return {
            definitions: this._definitions,
            loading: this._loading
        };
    }

    init(): void {
        this._loading = true;
        void this.listDefinitionsUseCase.execute().then(definitions => {
            runInAction(() => {
                this._definitions = definitions;
                this._loading = false;
            });
        });
    }
}

export const TaskDefinitionsPresenter = Abstraction.createImplementation({
    implementation: TaskDefinitionsPresenterImpl,
    dependencies: [ListDefinitionsUseCase]
});
```

- [ ] **Step 3: Create `feature.ts`**

Create `src/admin/presentation/TaskDefinitions/feature.ts`:

```typescript
import { createFeature } from "@webiny/feature/admin";
import { TaskDefinitionsPresenter as PresenterAbstraction } from "./abstractions.js";
import { TaskDefinitionsPresenter } from "./TaskDefinitionsPresenter.js";

export const TaskDefinitionsPresenterFeature = createFeature({
    name: "BackgroundTasks/TaskDefinitionsPresenter",
    register(container) {
        container.register(TaskDefinitionsPresenter).inSingletonScope();
    },
    resolve(container) {
        return { presenter: container.resolve(PresenterAbstraction) };
    }
});
```

- [ ] **Step 4: Create `index.ts`**

Create `src/admin/presentation/TaskDefinitions/index.ts`:

```typescript
export { TaskDefinitionsPresenter } from "./abstractions.js";
export { TaskDefinitionsPresenterFeature } from "./feature.js";
```

- [ ] **Step 5: Commit**

```bash
git add .
git commit -m "feat(background-tasks): add TaskDefinitions presenter"
```

---

### Task 3: Create TaskDefinitionsView Component

Build the React view for the definitions list.

**Files:**
- Create: `src/admin/presentation/TaskDefinitions/components/TaskDefinitionsView.tsx`

- [ ] **Step 1: Create `TaskDefinitionsView.tsx`**

Create `src/admin/presentation/TaskDefinitions/components/TaskDefinitionsView.tsx`:

```typescript
import React, { useEffect, useMemo } from "react";
import { observer } from "mobx-react-lite";
import { DiContainerProvider, useContainer, useFeature } from "@webiny/app";
import { DataTable, Heading, Separator, Text } from "@webiny/admin-ui";
import { TaskDefinitionsPresenterFeature } from "../feature.js";
import { ListDefinitionsFeature } from "~/admin/features/listDefinitions/feature.js";
import type { TaskDefinition } from "~/admin/shared/types.js";

const TaskDefinitionsViewInner = observer(function TaskDefinitionsViewInner() {
    const { presenter } = useFeature(TaskDefinitionsPresenterFeature);

    useEffect(() => {
        presenter.init();
    }, [presenter]);

    const { vm } = presenter;

    const columns = useMemo(
        () => ({
            title: {
                header: "Title",
                cell: (row: TaskDefinition) => (
                    <Text size="sm">{row.title || row.id}</Text>
                ),
                enableSorting: false,
                size: 250
            },
            id: {
                header: "ID",
                cell: (row: TaskDefinition) => (
                    <Text size="sm" className="text-neutral-strong font-mono">
                        {row.id}
                    </Text>
                ),
                enableSorting: false,
                size: 250
            },
            description: {
                header: "Description",
                cell: (row: TaskDefinition) => (
                    <Text size="sm" className="text-neutral-strong">
                        {row.description || "—"}
                    </Text>
                ),
                enableSorting: false
            }
        }),
        []
    );

    return (
        <div className="flex flex-col h-main-content">
            <div className="flex items-center justify-between py-sm px-md">
                <Heading level={5}>Task Definitions</Heading>
            </div>
            <Separator />
            <div className="flex-1 overflow-auto">
                {!vm.loading && vm.definitions.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full gap-md">
                        <Text className="text-neutral-strong">No task definitions found.</Text>
                    </div>
                ) : (
                    <DataTable<TaskDefinition>
                        columns={columns}
                        data={vm.definitions}
                        loading={vm.loading}
                        stickyHeader
                    />
                )}
            </div>
        </div>
    );
});

export const TaskDefinitionsView = () => {
    const container = useContainer();

    const scopedContainer = useMemo(() => {
        const child = container.createChildContainer();
        ListDefinitionsFeature.register(child);
        TaskDefinitionsPresenterFeature.register(child);
        return child;
    }, []);

    return (
        <DiContainerProvider container={scopedContainer}>
            <TaskDefinitionsViewInner />
        </DiContainerProvider>
    );
};
```

- [ ] **Step 2: Commit**

```bash
git add .
git commit -m "feat(background-tasks): add TaskDefinitionsView component"
```

---

### Task 4: Update Routes, Menu, and Feature Registration

Wire both views into the app with two routes and two menu items under Dev Tools.

**Files:**
- Modify: `src/admin/routes.ts`
- Modify: `src/admin/BackgroundTaskRoutes.tsx`
- Modify: `src/admin/BackgroundTasks.tsx`
- Modify: `src/admin/index.ts`

- [ ] **Step 1: Update `routes.ts`**

Replace full contents of `src/admin/routes.ts` with:

```typescript
import { Route } from "@webiny/app-admin";

export const Routes = {
    Definitions: new Route({
        name: "BackgroundTasks/Definitions",
        path: "/background-tasks/definitions"
    }),
    Executions: new Route({
        name: "BackgroundTasks/Executions",
        path: "/background-tasks/executions"
    })
};
```

- [ ] **Step 2: Update `BackgroundTaskRoutes.tsx`**

Replace full contents of `src/admin/BackgroundTaskRoutes.tsx` with:

```typescript
import React from "react";
import { AdminConfig } from "@webiny/app-admin";
import { useRouter } from "@webiny/app-admin";
import { AdminLayout } from "@webiny/app-admin";
import { HasPermission } from "./presentation/security/HasPermission.js";
import { TaskDefinitionsView } from "./presentation/TaskDefinitions/components/TaskDefinitionsView.js";
import { TaskExecutionsView } from "./presentation/TaskExecutions/components/TaskExecutionsView.js";
import { Routes } from "./routes.js";
import { ReactComponent as TaskIcon } from "@webiny/icons/task.svg";
import { ReactComponent as ListIcon } from "@webiny/icons/list.svg";

const { Menu, Route } = AdminConfig;

export const BackgroundTaskRoutes = () => {
    const { getLink } = useRouter();

    return (
        <AdminConfig>
            <HasPermission entity="task">
                <Route
                    route={Routes.Definitions}
                    element={
                        <AdminLayout title="Task Definitions">
                            <TaskDefinitionsView />
                        </AdminLayout>
                    }
                />
                <Route
                    route={Routes.Executions}
                    element={
                        <AdminLayout title="Task Executions">
                            <TaskExecutionsView />
                        </AdminLayout>
                    }
                />
                <Menu
                    name="backgroundTasks.definitions"
                    parent="dev-tools"
                    element={<Menu.Link
                        text="Task Definitions"
                        to={getLink(Routes.Definitions)}
                        icon={
                            <Menu.Link.Icon label="Task Definitions" element={<ListIcon />} />
                        }
                    />}
                />
                <Menu
                    name="backgroundTasks.executions"
                    parent="dev-tools"
                    element={<Menu.Link
                        text="Task Executions"
                        to={getLink(Routes.Executions)}
                        icon={
                            <Menu.Link.Icon label="Task Executions" element={<TaskIcon />} />
                        }
                    />}
                />
            </HasPermission>
        </AdminConfig>
    );
};
```

- [ ] **Step 3: Update `BackgroundTasks.tsx`**

Replace full contents of `src/admin/BackgroundTasks.tsx` with:

```typescript
import React from "react";
import { AdminConfig } from "@webiny/app-admin";
import { RegisterFeature } from "@webiny/app-admin";
import { ReactComponent as TaskIcon } from "@webiny/icons/task.svg";
import { ListTasksFeature } from "./features/listTasks/index.js";
import { GetTaskFeature } from "./features/getTask/index.js";
import { DeleteTaskFeature } from "./features/deleteTask/index.js";
import { AbortTaskFeature } from "./features/abortTask/index.js";
import { ListLogsFeature } from "./features/listLogs/index.js";
import { ListDefinitionsFeature } from "./features/listDefinitions/index.js";
import { TaskPermissionsFeature } from "./features/permissions/index.js";
import { TaskExecutionsPresenterFeature } from "./presentation/TaskExecutions/index.js";
import { TaskDefinitionsPresenterFeature } from "./presentation/TaskDefinitions/index.js";
import { TaskDetailPresenterFeature } from "./presentation/TaskDetail/index.js";
import { BackgroundTaskRoutes } from "./BackgroundTaskRoutes.js";
import { BACKGROUND_TASK_PERMISSIONS_SCHEMA } from "~/admin/permissions.js";

const { Security } = AdminConfig;

export const BackgroundTasks = () => {
    return (
        <>
            {/* Headless features. */}
            <RegisterFeature feature={ListTasksFeature} />
            <RegisterFeature feature={GetTaskFeature} />
            <RegisterFeature feature={DeleteTaskFeature} />
            <RegisterFeature feature={AbortTaskFeature} />
            <RegisterFeature feature={ListLogsFeature} />
            <RegisterFeature feature={ListDefinitionsFeature} />
            <RegisterFeature feature={TaskPermissionsFeature} />
            {/* Presentation features. */}
            <RegisterFeature feature={TaskExecutionsPresenterFeature} />
            <RegisterFeature feature={TaskDefinitionsPresenterFeature} />
            <RegisterFeature feature={TaskDetailPresenterFeature} />
            {/* Routes + menu. */}
            <BackgroundTaskRoutes />
            {/* Security permissions UI. */}
            <AdminConfig>
                <Security.Permissions
                    name="backgroundTasks"
                    title="Background Tasks"
                    description="Manage background task permissions."
                    icon={<TaskIcon />}
                    schema={BACKGROUND_TASK_PERMISSIONS_SCHEMA}
                />
            </AdminConfig>
        </>
    );
};
```

- [ ] **Step 4: Update `index.ts`**

Replace full contents of `src/admin/index.ts` with:

```typescript
export { BackgroundTasks } from "./BackgroundTasks.js";
export { Routes } from "./routes.js";
```

No change needed here — the exports are the same. The `Routes` object shape changed (now `Definitions` + `Executions` instead of `List`), but consumers import from `routes.ts` directly.

- [ ] **Step 5: Run pre-commit checklist**

```bash
git add .
yarn > /dev/null 2>&1
node scripts/generateTsConfigsInPackages.js
yarn adio
yarn format > /dev/null 2>&1
yarn lint
yarn webiny sync-dependencies
git add .
```

- [ ] **Step 6: Commit**

```bash
git commit -m "feat(background-tasks): split into definitions and executions views"
```

---

### Task 5: Build and Verify

Type-check and build the package to catch any broken imports or type errors.

- [ ] **Step 1: Type-check**

```bash
yarn check -p @webiny/background-tasks 2>&1 | tail -50
```

Expected: no type errors.

- [ ] **Step 2: Build**

```bash
yarn build -p @webiny/background-tasks 2>&1 | tail -30
```

Expected: successful build.

- [ ] **Step 3: Fix any errors found and re-run pre-commit checklist if needed**

If either step fails, fix the issues and rerun:

```bash
git add .
yarn > /dev/null 2>&1
node scripts/generateTsConfigsInPackages.js
yarn adio
yarn format > /dev/null 2>&1
yarn lint
yarn webiny sync-dependencies
git add .
git commit -m "fix(background-tasks): resolve build errors"
```
