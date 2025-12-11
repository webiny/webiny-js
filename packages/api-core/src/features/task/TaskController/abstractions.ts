import { createAbstraction } from "@webiny/feature/api";
import type { ITaskDataInput, ITaskResponseDoneResultOutput } from "../TaskDefinition/index.js";

/**
 * TaskController provides runtime capabilities to task definitions.
 * The actual interface is defined by the tasks package implementation via module augmentation.
 *
 * Import this from @webiny/api-core, but the full interface comes from @webiny/tasks.
 */
export interface ITaskController<
    I extends ITaskDataInput = ITaskDataInput,
    O extends ITaskResponseDoneResultOutput = ITaskResponseDoneResultOutput
> {
    // Empty - augmented by tasks package
}

export const TaskController = createAbstraction<ITaskController>("TaskController");

export namespace TaskController {
    export type Interface<
        I extends ITaskDataInput = ITaskDataInput,
        O extends ITaskResponseDoneResultOutput = ITaskResponseDoneResultOutput
    > = ITaskController<I, O>;
}
