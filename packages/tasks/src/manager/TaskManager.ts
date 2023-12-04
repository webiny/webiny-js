import { ITaskManager } from "./types";
import { ITaskRunner } from "~/runner/types";
import {
    Context,
    IResponseManager,
    ITaskData,
    ITaskDefinition,
    ITaskRunResponseManager
} from "~/types";
import { TaskResponseManager } from "~/manager/TaskResponseManager";

export interface ITaskManagerParams<T> {
    runner: ITaskRunner;
    context: Context;
    response: IResponseManager;
    task: ITaskData<T>;
    definition: ITaskDefinition;
}

export class TaskManager<T = unknown> implements ITaskManager {
    private readonly runner: Pick<ITaskRunner, "isTimeoutClose">;
    private readonly context: Context;
    private readonly definition: ITaskDefinition;
    private readonly task: ITaskData<T>;
    private readonly response: IResponseManager;
    private readonly taskResponse: ITaskRunResponseManager;

    public constructor(params: ITaskManagerParams<T>) {
        this.runner = params.runner;
        this.context = params.context;
        this.response = params.response;
        this.taskResponse = new TaskResponseManager();
        this.definition = params.definition;
        this.task = params.task;
    }

    public isTimeoutClose() {
        return this.runner.isTimeoutClose();
    }

    public async run() {
        /**
         * We should not even run if the Lambda timeout is close.
         */
        if (this.runner.isTimeoutClose()) {
            return this.response.continue({
                task: this.task,
                input: this.task.input
            });
        }

        try {
            const result = await this.definition.run({
                input: this.task.input,
                context: this.context,
                response: this.taskResponse,
                task: this.task,
                isTimeoutClose: () => {
                    return this.runner.isTimeoutClose();
                }
            });
            return this.response.from({
                input: this.task.input,
                id: this.task.id,
                ...result
            });
        } catch (ex) {
            return this.response.error({
                task: this.task,
                input: this.task.input,
                error: ex
            });
        }
    }
}
