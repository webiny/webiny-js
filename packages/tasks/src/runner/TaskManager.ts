import { ITaskManager, ITaskRunner } from "./abstractions";
import {
    Context,
    ITaskDataInput,
    ITaskDefinition,
    TaskDataStatus,
    TaskResponseStatus
} from "~/types";
import {
    IResponse,
    IResponseResult,
    ITaskResponse,
    ITaskResponseResult
} from "~/response/abstractions";
import { ITaskManagerStore } from "~/runner/abstractions";
import { getObjectProperties } from "~/runner/utils/getObjectProperties";

export class TaskManager<T = ITaskDataInput> implements ITaskManager<T> {
    private readonly runner: Pick<ITaskRunner, "isCloseToTimeout">;
    private readonly context: Context;
    private readonly response: IResponse;
    private readonly taskResponse: ITaskResponse;
    private readonly store: ITaskManagerStore;

    public constructor(
        runner: Pick<ITaskRunner, "isCloseToTimeout">,
        context: Context,
        response: IResponse,
        taskResponse: ITaskResponse,
        store: ITaskManagerStore
    ) {
        this.runner = runner;
        this.context = context;
        this.response = response;
        this.taskResponse = taskResponse;
        this.store = store;
    }

    public async run(definition: ITaskDefinition): Promise<IResponseResult> {
        /**
         * If task was aborted, do not run it again, return as it was done.
         */
        if (this.store.getStatus() === TaskDataStatus.ABORTED) {
            return this.response.aborted();
        }
        /**
         * If the task status is pending, update it to running and add a log.
         */
        //
        else if (this.store.getStatus() === TaskDataStatus.PENDING) {
            try {
                await this.store.updateTask({
                    taskStatus: TaskDataStatus.RUNNING,
                    startedOn: new Date().toISOString(),
                    executionName: this.response.event.executionName,
                    iterations: 1
                });
                await this.store.addInfoLog({
                    message: "Task started."
                });
            } catch (ex) {
                return this.response.error({
                    error: getObjectProperties(ex)
                });
            }
        }
        /**
         * Always update the task iteration.
         */
        //
        else {
            try {
                await this.store.updateTask(task => {
                    return {
                        iterations: task.iterations + 1
                    };
                });
            } catch (ex) {
                return this.response.error({
                    error: getObjectProperties(ex)
                });
            }
        }

        let result: ITaskResponseResult;

        try {
            const input = structuredClone(this.store.getInput());
            result = await definition.run({
                input,
                context: this.context,
                response: this.taskResponse,
                isCloseToTimeout: () => {
                    return this.runner.isCloseToTimeout();
                },
                isAborted: () => {
                    return this.store.getStatus() === TaskDataStatus.ABORTED;
                },
                store: this.store
            });
        } catch (ex) {
            return this.response.error({
                error: getObjectProperties(ex)
            });
        }

        if (result.status === TaskResponseStatus.CONTINUE) {
            return this.response.continue({
                input: result.input,
                wait: result.wait
            });
        } else if (result.status === TaskResponseStatus.ERROR) {
            return this.response.error({
                error: result.error
            });
        } else if (result.status === TaskResponseStatus.ABORTED) {
            return this.response.aborted();
        }
        return this.response.done({
            message: result.message
        });
    }
}
