import { ITaskResponseDoneResultOutput } from "@webiny/tasks";

export interface ICarsMockInput {
    amount: number;
    seconds?: number;
    amountOfTasks?: number;
    amountOfRecords?: number;
    overwrite?: boolean;
}

export type ICarsMockOutput = ITaskResponseDoneResultOutput;
