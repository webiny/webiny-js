import type { TaskRun } from "@webiny/sdk";

export type TaskStatus = "pending" | "running" | "success" | "failed" | "aborted";

export type Task = Omit<TaskRun, "taskStatus"> & {
    taskStatus: TaskStatus;
    createdOn?: string;
    savedOn?: string;
    createdBy?: {
        id: string;
        displayName: string;
        type?: string;
    };
};

export type { TaskLog } from "@webiny/sdk";
export type { TaskLogItem } from "@webiny/sdk";
export type { TaskDefinition } from "@webiny/sdk";

export interface BackgroundTaskSettings {
    retentionDays: number | undefined;
}
