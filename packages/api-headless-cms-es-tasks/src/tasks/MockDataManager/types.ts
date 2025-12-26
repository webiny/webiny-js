import { TaskDefinition } from "@webiny/api-core/features/task/TaskDefinition/index.js";

export interface IMockDataManagerInput extends TaskDefinition.TaskInput {
    modelId: string;
    amount: number;
    seconds?: number;
    amountOfTasks?: number;
    amountOfRecords?: number;
    overwrite?: boolean;
}

export type IMockDataManagerOutput = TaskDefinition.TaskOutput;
