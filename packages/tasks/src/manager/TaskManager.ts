import { ITaskManager } from "./types";
import { ITaskRunner } from "~/runner/types";
import {
    Context,
    IResponseManager,
    ITaskData,
    ITaskDefinition,
    ITaskRunResponse,
    ITaskRunResponseManager,
    TaskResponseStatus
} from "~/types";
import { TaskResponseManager } from "~/manager/TaskResponseManager";

export class TaskManager<T = unknown> implements ITaskManager {
    private readonly runner: Pick<ITaskRunner, "isCloseToTimeout">;
    private readonly context: Context;
    private readonly definition: ITaskDefinition;
    private readonly task: ITaskData<T>;
    private readonly response: IResponseManager;
    private readonly taskResponse: ITaskRunResponseManager;

    public constructor(
        runner: Pick<ITaskRunner, "isCloseToTimeout">,
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

    public async run(): Promise<ITaskRunResponse> {
        /**
         * We should not even run if the Lambda timeout is close.
         */
        if (this.runner.isCloseToTimeout()) {
            return this.response.continue({
                task: this.task,
                input: this.task.input
            });
        }

        let response: ITaskRunResponse;

        try {
            const result = await this.definition.run({
                input: structuredClone(this.task.input),
                context: this.context,
                response: this.taskResponse,
                task: structuredClone(this.task),
                isCloseToTimeout: () => {
                    return this.runner.isCloseToTimeout();
                }
            });
            response = await this.response.from({
                input: this.task.input,
                id: this.task.id,
                ...result
            });
        } catch (ex) {
            response = await this.response.error({
                task: this.task,
                input: this.task.input,
                error: ex
            });
        }

        switch (response.status) {
            case TaskResponseStatus.DONE:
                if (this.definition.onDone) {
                    try {
                        await this.definition.onDone({
                            context: this.context,
                            input: this.task.input
                        });
                    } catch {}
                }
                return response;
            case TaskResponseStatus.ERROR:
                if (this.definition.onError) {
                    try {
                        await this.definition.onError({
                            context: this.context,
                            input: this.task.input
                        });
                    } catch {}
                }
                return response;
            default:
                return response;
        }
    }
}
