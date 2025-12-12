import type {
    Context,
    IResponseContinueResult,
    IResponseResult,
    ITaskEvent
} from "../../../tasks/src/types";
import { TaskRunner } from "../../../tasks/src/runner";
import { timerFactory } from "../../../handler-aws/src/utils";
import { TaskEventValidation } from "../../../tasks/src/runner/TaskEventValidation";
import { ResponseContinueResult } from "../../../tasks/src/response/ResponseContinueResult";
import { createMockTaskServicePlugin } from "./mockTaskTriggerTransportPlugin";
import { TaskDefinition } from "../../../api-core/src/features/task/TaskDefinition/index.js";

export interface ICreateRunnerParamsOnContinueCallableParams {
    taskId: string;
    iteration: number;
    result: IResponseContinueResult;
}

export interface ICreateRunnerParamsOnContinueCallable {
    (params: ICreateRunnerParamsOnContinueCallableParams): Promise<void>;
}

export interface ICreateRunnerParams<
    I extends TaskDefinition.TaskDataInput = TaskDefinition.TaskDataInput,
    O extends TaskDefinition.TaskDoneOutput = TaskDefinition.TaskDoneOutput
> {
    context: Context;
    task: TaskDefinition.Interface<I, O>;
    getRemainingTimeInMills?: () => number;
    /**
     * If provided, this function will be called every time the task continues.
     * If the task is not supposed to continue, this function will not be called.
     */
    onContinue?: ICreateRunnerParamsOnContinueCallable;
}

export type IExecuteEvent = Pick<ITaskEvent, "webinyTaskId"> & Partial<Pick<ITaskEvent, "tenant">>;

export const createRunner = <
    I extends TaskDefinition.TaskDataInput = TaskDefinition.TaskDataInput,
    O extends TaskDefinition.TaskDoneOutput = TaskDefinition.TaskDoneOutput
>(
    params: ICreateRunnerParams<I, O>
) => {
    params.context.plugins.register(createMockTaskServicePlugin());
    const runner = new TaskRunner(
        params.context,
        timerFactory({
            getRemainingTimeInMillis: () => {
                if (!params.getRemainingTimeInMills) {
                    return 5 * 60 * 1000;
                }
                return params.getRemainingTimeInMills();
            }
        }),
        new TaskEventValidation()
    );

    const execute = async (event: IExecuteEvent) => {
        return await runner.run({
            tenant: "root",
            ...event,
            stateMachineId: "aMockStateMachineId",
            webinyTaskDefinitionId: params.task.id,
            endpoint: "manage",
            executionName: "aMockExecutionName"
        });
    };

    return async (event: IExecuteEvent) => {
        let iteration = 1;
        let result: IResponseResult;
        while ((result = await execute(event))) {
            if (result instanceof ResponseContinueResult && params.onContinue) {
                await params.onContinue({
                    taskId: event.webinyTaskId,
                    iteration,
                    result
                });
                iteration++;
                console.debug(`Continuing task ${params.task.id} #${iteration}.`);
                continue;
            }
            return result;
        }
        return result;
    };
};
