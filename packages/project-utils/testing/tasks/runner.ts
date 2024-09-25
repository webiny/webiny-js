import {
    Context,
    IResponseContinueResult,
    IResponseResult,
    ITaskDataInput,
    ITaskDefinition,
    ITaskEvent,
    ITaskResponseDoneResultOutput
} from "@webiny/tasks/types";
import { TaskRunner } from "@webiny/tasks/runner";
import { timerFactory } from "@webiny/handler-aws/utils";
import { TaskEventValidation } from "@webiny/tasks/runner/TaskEventValidation";
import { ResponseContinueResult } from "@webiny/tasks/response/ResponseContinueResult";
import { createMockTaskServicePlugin } from "./mockTaskTriggerTransportPlugin";

export interface ICreateRunnerParamsOnContinueCallableParams {
    taskId: string;
    iteration: number;
    result: IResponseContinueResult;
}

export interface ICreateRunnerParamsOnContinueCallable {
    (params: ICreateRunnerParamsOnContinueCallableParams): Promise<void>;
}

export interface ICreateRunnerParams<
    C extends Context = Context,
    I = ITaskDataInput,
    O extends ITaskResponseDoneResultOutput = ITaskResponseDoneResultOutput
> {
    context: Context;
    task: ITaskDefinition<C, I, O>;
    getRemainingTimeInMills?: () => number;
    /**
     * If provided, this function will be called every time the task continues.
     * If the task is not supposed to continue, this function will not be called.
     */
    onContinue?: ICreateRunnerParamsOnContinueCallable;
}

export type IExecuteEvent = Pick<ITaskEvent, "webinyTaskId"> &
    Partial<Pick<ITaskEvent, "tenant" | "locale">>;

export const createRunner = <
    C extends Context = Context,
    I = ITaskDataInput,
    O extends ITaskResponseDoneResultOutput = ITaskResponseDoneResultOutput
>(
    params: ICreateRunnerParams<C, I, O>
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
            locale: "en-US",
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
