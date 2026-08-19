import React, { useCallback, useEffect, useMemo, useState } from "react";
import debounce from "lodash/debounce.js";
import { observer } from "mobx-react-lite";
import { DiContainerProvider, useContainer, useFeature } from "@webiny/app";
import type { DataTableSorting, OnDataTableSortingChange } from "@webiny/admin-ui";
import {
    DataTable,
    DatePicker,
    Drawer,
    DropdownMenu,
    Heading,
    IconButton,
    Input,
    Scrollbar,
    Select,
    Separator,
    Skeleton,
    Tag,
    Text,
    TimeAgo
} from "@webiny/admin-ui";
import { useConfirmationDialog } from "@webiny/app-admin/hooks/index.js";
import { ReactComponent as MoreVerticalIcon } from "@webiny/icons/more_vert.svg";
import { ReactComponent as DeleteIcon } from "@webiny/icons/delete.svg";
import { ReactComponent as StopCircleIcon } from "@webiny/icons/stop_circle.svg";
import { ReactComponent as FilterIcon } from "@webiny/icons/filter_list.svg";
import { useToast } from "@webiny/admin-ui";
import { TaskExecutionsPresenterFeature } from "../feature.js";
import { ListTasksFeature } from "~/admin/features/listTasks/feature.js";
import { DeleteTaskFeature } from "~/admin/features/deleteTask/feature.js";
import { AbortTaskFeature } from "~/admin/features/abortTask/feature.js";
import { ListDefinitionsFeature } from "~/admin/features/listDefinitions/feature.js";
import { TaskPermissionsFeature } from "~/admin/features/permissions/feature.js";
import type { Task, TaskStatus } from "~/admin/shared/types.js";
import { TaskDetailDrawer } from "~/admin/presentation/TaskDetail/components/TaskDetailDrawer.js";
import { TaskDefinitionsButton } from "~/admin/presentation/TaskExecutions/components/TaskDefinitionsButton.js";

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
    const toast = useToast();

    useEffect(() => {
        presenter.init();
    }, [presenter]);

    const { vm } = presenter;

    const loadMoreOnScroll = useMemo(
        () =>
            debounce(({ scrollFrame }: { scrollFrame: { top: number } }) => {
                if (scrollFrame.top > 0.8) {
                    presenter.loadMore();
                }
            }, 200),
        [presenter]
    );

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
                    const def = vm.definitionOptions.find(d => d.value === row.definitionId);
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
                                    text="Abort"
                                    icon={<StopCircleIcon />}
                                    onClick={() => {
                                        showAbortConfirmation(() =>
                                            presenter.abortTask(row.id).then(() => {
                                                toast.showSuccessToast({ title: "Task aborted." });
                                            })
                                        );
                                    }}
                                />
                            )}
                            {isTerminal && vm.permissions.canDelete && (
                                <>
                                    {isRunning && <DropdownMenu.Separator />}
                                    <DropdownMenu.Item
                                        text="Delete"
                                        icon={<DeleteIcon />}
                                        onClick={() => {
                                            showDeleteConfirmation(() =>
                                                presenter.deleteTask(row.id).then(() => {
                                                    toast.showSuccessToast({
                                                        title: "Task deleted."
                                                    });
                                                })
                                            );
                                        }}
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
        [vm.permissions, vm.definitionOptions]
    );

    const [filtersOpen, setFiltersOpen] = useState(false);
    const hasFilters = Object.keys(vm.list.filters).length > 0;
    const hasActiveFilters = hasFilters || !!vm.list.search;

    const clearAllFilters = () => {
        presenter.filter.clearAll();
        presenter.search.set("");
    };

    return (
        <>
            <div className="flex flex-col h-main-content">
                <div className="flex items-center justify-between py-sm px-md">
                    <Heading level={5}>Task Executions</Heading>
                    <div className="flex items-center gap-sm">
                        <IconButton
                            variant={hasActiveFilters ? "primary" : "ghost"}
                            icon={<FilterIcon />}
                            onClick={() => setFiltersOpen(true)}
                            data-testid="background-tasks.toggle-filters"
                        />
                        <TaskDefinitionsButton />
                    </div>
                </div>
                <Separator />
                <Drawer
                    open={filtersOpen}
                    onClose={() => setFiltersOpen(false)}
                    modal={true}
                    width={360}
                    title="Filters"
                    headerSeparator={true}
                    footerSeparator={true}
                    bodyPadding={false}
                    actions={
                        <>
                            <Drawer.CancelButton text="Clear all" onClick={clearAllFilters} />
                            <Drawer.ConfirmButton
                                text="Apply filters"
                                onClick={() => setFiltersOpen(false)}
                            />
                        </>
                    }
                >
                    <div className="flex flex-col gap-lg p-lg">
                        <Input
                            size={"md"}
                            label="Search"
                            placeholder="Search by name..."
                            value={vm.list.search}
                            onChange={value => {
                                presenter.search.set(value);
                            }}
                        />
                        <Select
                            size={"md"}
                            label="Status"
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
                        {vm.definitionOptions.length > 0 ? (
                            <Select
                                size={"md"}
                                label="Definition"
                                placeholder="Definition"
                                options={vm.definitionOptions}
                                value={vm.list.filters.definitionId as string}
                                onChange={value => {
                                    if (value) {
                                        presenter.filter.set("definitionId", value);
                                    } else {
                                        presenter.filter.clear("definitionId");
                                    }
                                }}
                            />
                        ) : null}
                        <DatePicker
                            size={"md"}
                            type="dateTimeTz"
                            label="Created from"
                            placeholder="Created from"
                            value={vm.list.filters.createdOn_gte as string}
                            onChange={value => {
                                if (value) {
                                    presenter.filter.set("createdOn_gte", value);
                                } else {
                                    presenter.filter.clear("createdOn_gte");
                                }
                            }}
                        />
                        <DatePicker
                            size={"md"}
                            type="dateTimeTz"
                            label="Created to"
                            placeholder="Created to"
                            value={vm.list.filters.createdOn_lte as string}
                            onChange={value => {
                                if (value) {
                                    presenter.filter.set("createdOn_lte", value);
                                } else {
                                    presenter.filter.clear("createdOn_lte");
                                }
                            }}
                        />
                    </div>
                </Drawer>
                <div className="flex-1 overflow-hidden">
                    {!vm.list.pagination.loading &&
                    !vm.list.pagination.loadingMore &&
                    vm.list.rows.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full gap-md">
                            <Text className="text-neutral-strong">No tasks found.</Text>
                        </div>
                    ) : (
                        <Scrollbar onScrollFrame={scrollFrame => loadMoreOnScroll({ scrollFrame })}>
                            <DataTable<Task>
                                columns={columns}
                                data={vm.list.rows}
                                loading={vm.list.pagination.loading}
                                sorting={sorting}
                                onSortingChange={onSortingChange}
                                stickyHeader
                            />
                            {vm.list.pagination.loadingMore ? (
                                <div className="flex flex-col gap-sm p-md">
                                    <Skeleton className="h-8 w-full" />
                                    <Skeleton className="h-8 w-full" />
                                </div>
                            ) : null}
                        </Scrollbar>
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
                        toast.showSuccessToast({ title: "Task aborted." });
                    }}
                    onDelete={async (id: string) => {
                        await presenter.deleteTask(id);
                        toast.showSuccessToast({ title: "Task deleted." });
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
