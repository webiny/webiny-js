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

export class TaskManager<T = unknown> implements ITaskManager {
    private readonly runner: Pick<ITaskRunner, "isTimeoutClose">;
    private readonly context: Context;
    private readonly definition: ITaskDefinition;
    private readonly task: ITaskData<T>;
    private readonly response: IResponseManager;
    private readonly taskResponse: ITaskRunResponseManager;

    public constructor(
        runner: Pick<ITaskRunner, "isTimeoutClose">,
        context: Context,
        response: IResponseManager,
        task: ITaskData<T>,
        definition: ITaskDefinition,
        taskResponse: ITaskRunResponseManager = new TaskResponseManager()
    ) {
        this.runner = runner;
        this.context = context;
        this.response = response;
        this.taskResponse = taskResponse;
        this.definition = definition;
        this.task = task;
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
            return await this.response.from({
                input: this.task.input,
                id: this.task.id,
                ...result
            });
        } catch (ex) {
            return await this.response.error({
                task: this.task,
                input: this.task.input,
                error: ex
            });
        }
    }
}
