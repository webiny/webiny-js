import type { Context, IResponseContinueResult, IResponseResult, ITaskEvent } from "~/api/types.js";
import { TaskRunner } from "~/api/runner/index.js";
import { timerFactory } from "@webiny/utils/features/Timer/factory.js";
import { TaskEventValidation } from "~/api/runner/TaskEventValidation.js";
import { ResponseContinueResult } from "~/api/response/ResponseContinueResult.js";
import { createMockTaskService } from "./mockTaskTriggerTransportPlugin.js";
import { TaskService } from "~/api/domain/TaskService.js";
import { TaskDefinition } from "@webiny/api-core/features/task/TaskDefinition/index.js";

export interface ICreateRunnerParamsOnContinueCallableParams {
    taskId: string;
    iteration: number;
    result: IResponseContinueResult;
}

export interface ICreateRunnerParamsOnContinueCallable {
    (params: ICreateRunnerParamsOnContinueCallableParams): Promise<void>;
}

export interface ICreateRunnerParams<
    I extends TaskDefinition.TaskInput = TaskDefinition.TaskInput,
    O extends TaskDefinition.TaskOutput = TaskDefinition.TaskOutput
> {
    context: Context;
    task: TaskDefinition.Interface<I, O>;
    getRemainingTimeInMills?: () => number;
    onContinue?: ICreateRunnerParamsOnContinueCallable;
}

export type IExecuteEvent = Pick<ITaskEvent, "webinyTaskId"> & Partial<Pick<ITaskEvent, "tenant">>;

export const createRunner = <
    I extends TaskDefinition.TaskInput = TaskDefinition.TaskInput,
    O extends TaskDefinition.TaskOutput = TaskDefinition.TaskOutput
>(
    params: ICreateRunnerParams<I, O>
) => {
    params.context.container.registerInstance(TaskService, createMockTaskService());
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
