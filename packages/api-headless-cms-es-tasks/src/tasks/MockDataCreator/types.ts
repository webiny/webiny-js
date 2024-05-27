import { ITaskResponseDoneResultOutput } from "@webiny/tasks";

export interface IMockDataCreatorInput {
    totalAmount: number;
    createdAmount: number;
}

export type IMockDataCreatorOutput = ITaskResponseDoneResultOutput;
