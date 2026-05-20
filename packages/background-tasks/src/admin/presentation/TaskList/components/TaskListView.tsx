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
import { ReactComponent as SearchIcon } from "@webiny/icons/search.svg";
import { TaskListPresenterFeature } from "../feature.js";
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
    { label: "Success", value: "completed" },
    { label: "Failed", value: "failed" },
    { label: "Aborted", value: "aborted" }
];

const TaskListViewInner = observer(function TaskListViewInner() {
    const { presenter } = useFeature(TaskListPresenterFeature);
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
                    row.startedOn ? (
                        <TimeAgo datetime={row.startedOn} />
                    ) : (
                        <Text size="sm">—</Text>
                    ),
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
                        row.taskStatus === "completed" ||
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
                    <Heading level={5}>Background Tasks</Heading>
                </div>
                <Separator />
                <div className="flex items-center gap-sm px-md py-xs flex-wrap">
                    <div className="w-[240px]">
                        <Input
                            placeholder="Search by name..."
                            icon={<SearchIcon />}
                            size="sm"
                            value={vm.list.search}
                            onChange={e => presenter.search.set(e.target.value)}
                        />
                    </div>
                    <div className="w-[160px]">
                        <Select
                            placeholder="Status"
                            size="sm"
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
                                size="sm"
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
                            placeholder="Created from"
                            size="sm"
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
                            placeholder="Created to"
                            size="sm"
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

export const TaskListView = () => {
    const container = useContainer();

    const scopedContainer = useMemo(() => {
        const child = container.createChildContainer();
        ListTasksFeature.register(child);
        DeleteTaskFeature.register(child);
        AbortTaskFeature.register(child);
        ListDefinitionsFeature.register(child);
        TaskPermissionsFeature.register(child);
        TaskListPresenterFeature.register(child);
        return child;
    }, []);

    return (
        <DiContainerProvider container={scopedContainer}>
            <TaskListViewInner />
        </DiContainerProvider>
    );
};
