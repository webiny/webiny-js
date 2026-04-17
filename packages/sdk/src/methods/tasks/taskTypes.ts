export type TaskStatus = "pending" | "running" | "completed" | "failed" | "aborted" | "stopped";

export interface TaskDefinition {
    id: string;
    title: string;
    description?: string;
}

export interface TaskRun {
    id: string;
    startedOn?: string;
    finishedOn?: string;
    name?: string;
    definitionId: string;
    iterations?: number;
    parentId?: string;
    executionName?: string;
    eventResponse?: unknown;
    taskStatus: TaskStatus;
    input?: unknown;
    output?: unknown;
}

export interface TaskLogItem {
    message: string;
    createdOn: string;
    type: string;
    data?: unknown;
    error?: unknown;
}

export interface TaskLog {
    id: string;
    createdOn: string;
    executionName?: string;
    iteration?: number;
    items: TaskLogItem[];
}
