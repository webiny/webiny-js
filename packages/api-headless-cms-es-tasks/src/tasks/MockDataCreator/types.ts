import { TaskDefinition } from "@webiny/api-core/features/task/TaskDefinition/index.js";

export interface IMockDataCreatorInput extends TaskDefinition.TaskInput {
    totalAmount: number;
    createdAmount: number;
}

export type IMockDataCreatorOutput = TaskDefinition.TaskOutput;
