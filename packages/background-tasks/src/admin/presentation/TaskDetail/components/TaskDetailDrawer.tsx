import React, { useEffect, useMemo, useState } from "react";
import { observer } from "mobx-react-lite";
import { DiContainerProvider, useContainer, useFeature } from "@webiny/app";
import { Button, Drawer, Grid, Heading, Separator, Tag, Text, TimeAgo } from "@webiny/admin-ui";
import { CodeEditor } from "@webiny/admin-ui";
import { useConfirmationDialog } from "@webiny/app-admin/hooks/index.js";
import { ReactComponent as StopCircleIcon } from "@webiny/icons/stop_circle.svg";
import { ReactComponent as DeleteIcon } from "@webiny/icons/delete.svg";
import { ReactComponent as ExpandMoreIcon } from "@webiny/icons/expand_more.svg";
import { ReactComponent as ExpandLessIcon } from "@webiny/icons/expand_less.svg";
import { TaskDetailPresenterFeature } from "../feature.js";
import { GetTaskFeature } from "~/admin/features/getTask/feature.js";
import { ListLogsFeature } from "~/admin/features/listLogs/feature.js";
import type { Task, TaskLog, TaskLogItem } from "~/admin/shared/types.js";

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

const formatJson = (value: unknown): string => {
    if (value === null || value === undefined) {
        return "";
    }
    if (typeof value === "string") {
        try {
            return JSON.stringify(JSON.parse(value), null, 2);
        } catch {
            return value;
        }
    }
    return JSON.stringify(value, null, 2);
};

interface ExpandButtonProps {
    show: boolean;
    expanded: boolean;
    onClick: () => void;
}

const ExpandButton = ({ show, expanded, onClick }: ExpandButtonProps) => {
    if (!show) {
        return null;
    }

    return (
        <Button
            variant="tertiary"
            size="sm"
            icon={expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            onClick={onClick}
        />
    );
};

interface ExpandedPayloadProps {
    show: boolean;
    label: string;
    value: unknown;
    variant?: "default" | "destructive";
}

const ExpandedPayload = ({ show, label, value, variant = "default" }: ExpandedPayloadProps) => {
    if (!show) {
        return null;
    }

    const textClass = variant === "destructive" ? " text-destructive" : "";

    return (
        <div className="mt-xs">
            <Text size="sm" className="text-neutral-strong mb-xs">
                {label}
            </Text>
            <pre
                className={`bg-neutral-light rounded-sm p-sm text-xs overflow-auto max-h-[200px]${textClass}`}
            >
                {formatJson(value)}
            </pre>
        </div>
    );
};

interface JsonSectionProps {
    show: boolean;
    title: string;
    value: string;
}

const JsonSection = ({ show, title, value }: JsonSectionProps) => {
    if (!show) {
        return null;
    }

    return (
        <>
            <Separator />
            <div>
                <Heading level={6} className="mb-sm">
                    {title}
                </Heading>
                <CodeEditor value={value} language="json" disabled={true} />
            </div>
        </>
    );
};

interface LoadMoreLogsButtonProps {
    show: boolean;
    loading: boolean;
    onClick: () => void;
}

const LoadMoreLogsButton = ({ show, loading, onClick }: LoadMoreLogsButtonProps) => {
    if (!show) {
        return null;
    }

    return (
        <div className="mt-sm">
            <Button variant="tertiary" size="sm" onClick={onClick} disabled={loading}>
                {loading ? "Loading..." : "Load more logs"}
            </Button>
        </div>
    );
};

interface DrawerActionsProps {
    isRunning: boolean;
    isTerminal: boolean;
    onAbort: () => void;
    onDelete: () => void;
}

const DrawerActions = ({ isRunning, isTerminal, onAbort, onDelete }: DrawerActionsProps) => {
    if (!isRunning && !isTerminal) {
        return null;
    }

    return (
        <div className="flex gap-sm">
            {isRunning ? (
                <Button variant="secondary" size="sm" icon={<StopCircleIcon />} onClick={onAbort}>
                    Abort
                </Button>
            ) : null}
            {isTerminal ? (
                <Button variant="secondary" size="sm" icon={<DeleteIcon />} onClick={onDelete}>
                    Delete
                </Button>
            ) : null}
        </div>
    );
};

interface LogItemViewProps {
    item: TaskLogItem;
}

const LogItemView = ({ item }: LogItemViewProps) => {
    const [expanded, setExpanded] = useState(false);
    const hasData = item.data !== null && item.data !== undefined;
    const hasError = item.error !== null && item.error !== undefined;
    const expandable = hasData || hasError;

    return (
        <div className="border-b-sm border-neutral-muted py-xs px-sm">
            <div className="flex items-start gap-sm">
                <div className="flex-shrink-0 pt-[2px]">
                    <Tag
                        variant={item.type === "error" ? "destructive" : "neutral-light"}
                        content={item.type}
                    />
                </div>
                <div className="flex-1 min-w-0">
                    <Text size="sm">{item.message}</Text>
                </div>
                <div className="flex items-center gap-xs flex-shrink-0">
                    <Text size="sm" className="text-neutral-strong">
                        <TimeAgo datetime={item.createdOn} />
                    </Text>
                    <ExpandButton
                        show={expandable}
                        expanded={expanded}
                        onClick={() => setExpanded(!expanded)}
                    />
                </div>
            </div>
            <ExpandedPayload show={expanded && hasData} label="Data" value={item.data} />
            <ExpandedPayload
                show={expanded && hasError}
                label="Error"
                value={item.error}
                variant="destructive"
            />
        </div>
    );
};

interface TaskDetailDrawerProps {
    task: Task;
    open: boolean;
    onClose: () => void;
    onAbort: (id: string) => Promise<void>;
    onDelete: (id: string) => Promise<void>;
}

const TaskDetailDrawerInner = observer(function TaskDetailDrawerInner({
    task,
    open,
    onClose,
    onAbort,
    onDelete
}: TaskDetailDrawerProps) {
    const { presenter } = useFeature(TaskDetailPresenterFeature);

    useEffect(() => {
        if (open) {
            void presenter.init(task.id);
        }
    }, [presenter, task.id, open]);

    const { vm } = presenter;

    const { showConfirmation: showAbortConfirmation } = useConfirmationDialog({
        title: "Abort Task",
        message: "Are you sure you want to abort this running task?"
    });

    const { showConfirmation: showDeleteConfirmation } = useConfirmationDialog({
        title: "Delete Task",
        message: "Are you sure you want to delete this task?"
    });

    const displayTask = vm.task ?? task;
    const isRunning = displayTask.taskStatus === "running";
    const isTerminal =
        displayTask.taskStatus === "success" ||
        displayTask.taskStatus === "failed" ||
        displayTask.taskStatus === "aborted";

    const inputJson = formatJson(displayTask.input);
    const outputJson = formatJson(displayTask.output);

    return (
        <Drawer
            open={open}
            onOpenChange={isOpen => !isOpen && onClose()}
            title={
                <div className="flex items-center gap-sm">
                    <span>{displayTask.name || displayTask.definitionId}</span>
                    <Tag
                        variant={STATUS_TAG_VARIANT[displayTask.taskStatus] ?? "neutral-light"}
                        content={displayTask.taskStatus}
                    />
                </div>
            }
            modal={true}
            width="900px"
            bodyPadding={false}
            actions={
                <DrawerActions
                    isRunning={isRunning}
                    isTerminal={isTerminal}
                    onAbort={() => showAbortConfirmation(() => onAbort(displayTask.id))}
                    onDelete={() => showDeleteConfirmation(() => onDelete(displayTask.id))}
                />
            }
        >
            <div className="flex flex-col gap-md p-md overflow-auto">
                <div>
                    <Heading level={6} className="mb-sm">
                        General Info
                    </Heading>
                    <Grid gap="comfortable">
                        <Grid.Column span={6}>
                            <Text size="sm" className="text-neutral-strong">
                                Definition
                            </Text>
                            <Text size="sm">{displayTask.definitionId}</Text>
                        </Grid.Column>
                        <Grid.Column span={6}>
                            <Text size="sm" className="text-neutral-strong">
                                Created By
                            </Text>
                            <Text size="sm">{displayTask.createdBy?.displayName ?? "—"}</Text>
                        </Grid.Column>
                        <Grid.Column span={6}>
                            <Text size="sm" className="text-neutral-strong">
                                Created On
                            </Text>
                            <Text size="sm">
                                {displayTask.createdOn ? (
                                    <TimeAgo datetime={displayTask.createdOn} />
                                ) : (
                                    "—"
                                )}
                            </Text>
                        </Grid.Column>
                        <Grid.Column span={6}>
                            <Text size="sm" className="text-neutral-strong">
                                Started On
                            </Text>
                            <Text size="sm">
                                {displayTask.startedOn ? (
                                    <TimeAgo datetime={displayTask.startedOn} />
                                ) : (
                                    "—"
                                )}
                            </Text>
                        </Grid.Column>
                        <Grid.Column span={6}>
                            <Text size="sm" className="text-neutral-strong">
                                Finished On
                            </Text>
                            <Text size="sm">
                                {displayTask.finishedOn ? (
                                    <TimeAgo datetime={displayTask.finishedOn} />
                                ) : (
                                    "—"
                                )}
                            </Text>
                        </Grid.Column>
                        <Grid.Column span={6}>
                            <Text size="sm" className="text-neutral-strong">
                                Iterations
                            </Text>
                            <Text size="sm">{displayTask.iterations ?? 0}</Text>
                        </Grid.Column>
                    </Grid>
                </div>

                <JsonSection show={!!inputJson} title="Input" value={inputJson} />
                <JsonSection show={!!outputJson} title="Output" value={outputJson} />

                <Separator />
                <div>
                    <Heading level={6} className="mb-sm">
                        Logs ({vm.logs.pagination.totalCount})
                    </Heading>
                    {vm.logs.rows.length === 0 && !vm.logs.pagination.loading ? (
                        <Text size="sm" className="text-neutral-strong">
                            No logs available.
                        </Text>
                    ) : (
                        <div className="border-sm border-neutral-muted rounded-sm">
                            {vm.logs.rows.map((log: TaskLog) =>
                                log.items.map((item, idx) => (
                                    <LogItemView key={`${log.id}-${idx}`} item={item} />
                                ))
                            )}
                        </div>
                    )}
                    <LoadMoreLogsButton
                        show={vm.logs.pagination.hasMore}
                        loading={vm.logs.pagination.loading}
                        onClick={() => presenter.loadMore()}
                    />
                </div>
            </div>
        </Drawer>
    );
});

export const TaskDetailDrawer = (props: TaskDetailDrawerProps) => {
    const container = useContainer();

    const scopedContainer = useMemo(() => {
        const child = container.createChildContainer();
        GetTaskFeature.register(child);
        ListLogsFeature.register(child);
        TaskDetailPresenterFeature.register(child);
        return child;
    }, []);

    return (
        <DiContainerProvider container={scopedContainer}>
            <TaskDetailDrawerInner {...props} />
        </DiContainerProvider>
    );
};
