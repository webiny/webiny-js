import { createAbstraction } from "@webiny/feature/api";
import type { ITaskInput, ITaskOutput } from "../TaskDefinition/index.js";

/**
 * TaskController provides runtime capabilities to task definitions.
 * The actual interface is defined by the tasks package implementation via module augmentation.
 *
 * Import this from @webiny/api-core, but the full interface comes from @webiny/tasks.
 */
export interface ITaskController<
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    I extends ITaskInput = ITaskInput,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    O extends ITaskOutput = ITaskOutput
> {
    // Empty - augmented by tasks package
}

/** Runtime controller providing capabilities to running tasks. */
export const TaskController = createAbstraction<ITaskController>("TaskController");

export namespace TaskController {
    export type Interface<
        I extends ITaskInput = ITaskInput,
        O extends ITaskOutput = ITaskOutput
    > = ITaskController<I, O>;
}
