import type { IResponseError } from "@webiny/api-core/features/task/TaskDefinition";
import type { TaskDataStatus } from "~/types.js";
import {
    type ITaskTriggerParams,
    TaskService
} from "@webiny/api-core/features/task/TaskService/index.js";
import { TaskDefinition } from "@webiny/api-core/features/task/TaskDefinition/index.js";
import type { ITaskResponse } from "~/response/abstractions/index.js";

/**
 * Augment the TaskController interface from api-core with implementation details.
 * This allows developers to import from @webiny/api-core but get the full interface.
 */
declare module "@webiny/api-core/features/task/TaskController/abstractions.js" {
    interface ITaskController<
        I extends TaskDefinition.TaskInput = TaskDefinition.TaskInput,
        O extends TaskDefinition.TaskOutput = TaskDefinition.TaskOutput
    > {
        /**
         * Response object
         */
        response: ITaskResponse<I, O>;

        /**
         * State management - access and update task state
         */
        state: {
            getTask(): TaskService.Task<I, O>;
            getStatus(): TaskDataStatus;
            getInput(): I;
            getOutput(): O | undefined;
            updateInput(input: Partial<I>): Promise<void>;
            updateOutput(output: Partial<O>): Promise<void>;
        };

        /**
         * Logging - add log entries to task
         */
        logger: {
            info(params: { message: string; data?: Record<string, any> }): Promise<void>;
            error(params: {
                message: string;
                error?: Error | IResponseError;
                data?: Record<string, any>;
            }): Promise<void>;
        };

        /**
         * Task management - trigger and query child tasks
         */
        task: {
            trigger<CI extends TaskDefinition.TaskInput = TaskDefinition.TaskInput>(
                params: ITaskTriggerParams<CI>
            ): Promise<TaskService.Task<CI>>;

            listChildren<
                CT extends TaskDefinition.TaskInput = I,
                CO extends TaskDefinition.TaskOutput = O
            >(
                definitionId?: string
            ): Promise<TaskService.Task<CT, CO>[]>;
        };

        /**
         * Runtime checks
         */
        runtime: {
            isCloseToTimeout(seconds?: number): boolean;
            isAborted(): boolean;
            getRemainingSeconds(): number;
            getRemainingMilliseconds(): number;
        };
    }
}
