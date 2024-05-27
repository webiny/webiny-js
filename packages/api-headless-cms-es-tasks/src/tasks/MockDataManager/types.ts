import { ITaskResponseDoneResultOutput } from "@webiny/tasks";

export interface IMockDataManagerInput {
    modelId: string;
    amount: number;
    seconds?: number;
    amountOfTasks?: number;
    amountOfRecords?: number;
    overwrite?: boolean;
}

export type IMockDataManagerOutput = ITaskResponseDoneResultOutput;
