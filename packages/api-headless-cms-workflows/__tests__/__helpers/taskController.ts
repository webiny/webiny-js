import type { TaskController } from "@webiny/api-core/features/task/TaskController/index.js";
import { TaskResultStatus } from "@webiny/api-core/features/task/TaskDefinition/index.js";

interface TaskErrorLike {
    message?: string;
    code?: string;
    data?: unknown;
}

/**
 * The parts of the background-task controller the "delete model and entries" task uses, for
 * running its handler directly (the task runner is not part of this package's harness).
 */
export const createTaskController = (): TaskController.Interface => {
    const controller = {
        response: {
            done: (message?: string) => ({ status: TaskResultStatus.DONE, message }),
            continue: (input: unknown) => ({ status: TaskResultStatus.CONTINUE, input }),
            aborted: () => ({ status: TaskResultStatus.ABORTED }),
            error: (error: TaskErrorLike) => ({
                status: TaskResultStatus.ERROR,
                error: { message: error.message, code: error.code, data: error.data }
            })
        },
        runtime: {
            isAborted: () => false,
            isCloseToTimeout: () => false
        }
    };
    return controller as unknown as TaskController.Interface;
};
