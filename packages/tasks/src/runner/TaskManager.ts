import { ITaskManager, ITaskRunner } from "./abstractions";
import { Context, ITaskData, ITaskDefinition, TaskDataStatus, TaskResponseStatus } from "~/types";
import {
    IResponse,
    IResponseResult,
    ITaskResponse,
    ITaskResponseResult
} from "~/response/abstractions";
import { TaskResponse } from "~/response";
import { ITaskManagerStore } from "~/runner/abstractions/ITaskManagerStore";
import { TaskManagerStore } from "~/runner/TaskManagerStore";

export class TaskManager<T = unknown> implements ITaskManager {
    private readonly runner: Pick<ITaskRunner, "isCloseToTimeout">;
    private readonly context: Context;
    private readonly definition: ITaskDefinition;
    private readonly task: ITaskData<T>;
    private readonly response: IResponse;
    private readonly taskResponse: ITaskResponse;
    private readonly store: ITaskManagerStore;

    public constructor(
        runner: Pick<ITaskRunner, "isCloseToTimeout">,
        context: Context,
        response: IResponse,
        task: ITaskData<T>,
        definition: ITaskDefinition
    ) {
        this.runner = runner;
        this.context = context;
        this.response = response;
        this.definition = definition;
        this.task = task;
        this.taskResponse = new TaskResponse(this.response);
        this.store = new TaskManagerStore(this.context, this.task);
    }

    public async run(): Promise<IResponseResult> {
        /**
         * We should not even run if the Lambda timeout is close.
         */
        if (this.runner.isCloseToTimeout()) {
            /**
             * We use the same input as the one on the task - we did not run anything, so no need to change the input.
             */
            return this.response.continue({
                values: this.task.values
            });
        }
        /**
         * If task was stopped, do not run it again, return as it was done.
         */
        //
        else if (this.task.status === TaskDataStatus.STOPPED) {
            return this.response.stopped();
        }
        /**
         * If the task status is pending, update it to running and add a log.
         */
        //
        else if (this.task.status === TaskDataStatus.PENDING) {
            try {
                await this.context.tasks.updateTask(this.task.id, {
                    status: TaskDataStatus.RUNNING,
                    startedOn: new Date().toISOString(),
                    log: (this.task.log || []).concat([
                        {
                            message: "Task started.",
                            createdOn: new Date().toISOString()
                        }
                    ])
                });
            } catch (ex) {
                return this.response.error({
                    error: ex
                });
            }
        }

        let result: ITaskResponseResult;

        try {
            result = await this.definition.run({
                values: structuredClone(this.task.values),
                context: this.context,
                response: this.taskResponse,
                isCloseToTimeout: () => {
                    return this.runner.isCloseToTimeout();
                },
                isStopped: () => {
                    return this.task.status === TaskDataStatus.STOPPED;
                },
                store: this.store
            });
        } catch (ex) {
            return this.response.error({
                error: ex
            });
        }

        if (result.status === TaskResponseStatus.CONTINUE) {
            return this.response.continue({
                values: result.values
            });
        } else if (result.status === TaskResponseStatus.ERROR) {
            return this.response.error({
                error: result.error
            });
        } else if (result.status === TaskResponseStatus.STOPPED) {
            return this.response.stopped();
        }
        return this.response.done({
            message: result.message
        });
    }
}
