import type {
    ITaskDataInput,
    IResponseError,
    ITaskResponseDoneResultOutput,
    ITaskResult
} from "@webiny/api-core/features/task/TaskDefinition";
import type { ITask, TaskDataStatus } from "~/types.js";
import type { ITaskTriggerParams } from "@webiny/api-core/features/task/TaskService/index.js";

/**
 * Augment the TaskController interface from api-core with implementation details.
 * This allows developers to import from @webiny/api-core but get the full interface.
 */
declare module "@webiny/api-core/features/task/TaskController/abstractions.js" {
    interface ITaskController<
        I extends ITaskDataInput = ITaskDataInput,
        O extends ITaskResponseDoneResultOutput = ITaskResponseDoneResultOutput
    > {
        /**
         * Response helpers - create typed result objects
         */
        response: {
            done(message?: string, output?: O): ITaskResult<I, O>;
            continue(input: I, options?: { wait?: number; message?: string }): ITaskResult<I, O>;
            error(message: string, error?: Error | IResponseError): ITaskResult<I, O>;
            aborted(message?: string): ITaskResult<I, O>;
        };

        /**
         * State management - access and update task state
         */
        state: {
            getTask(): ITask<I, O>;
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
            info(message: string, data?: Record<string, any>): Promise<void>;
            error(
                message: string,
                error?: Error | IResponseError,
                data?: Record<string, any>
            ): Promise<void>;
        };

        /**
         * Task management - trigger and query child tasks
         */
        task: {
            trigger<CI extends ITaskDataInput = ITaskDataInput>(
                params: ITaskTriggerParams<CI>
            ): Promise<ITask<CI>>;

            listChildren<
                CT extends ITaskDataInput = I,
                CO extends ITaskResponseDoneResultOutput = O
            >(
                definitionId?: string
            ): Promise<ITask<CT, CO>[]>;
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
