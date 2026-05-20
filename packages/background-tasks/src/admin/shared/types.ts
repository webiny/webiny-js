import type { TaskRun } from "@webiny/sdk";

export type Task = TaskRun & {
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
export type { TaskStatus } from "@webiny/sdk";
