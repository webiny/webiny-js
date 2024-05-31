import {
    Context,
    ITaskDataInput,
    ITaskDefinition,
    ITaskEvent,
    ITaskResponseDoneResultOutput
} from "@webiny/tasks/types";
import { TaskRunner } from "@webiny/tasks/runner";
import { timerFactory } from "@webiny/handler-aws/utils";
import { TaskEventValidation } from "@webiny/tasks/runner/TaskEventValidation";
import { createMockTaskTriggerTransportPlugin } from "./mockTaskTriggerTransportPlugin";

export interface CreateRunnerParams<
    C extends Context = Context,
    I = ITaskDataInput,
    O extends ITaskResponseDoneResultOutput = ITaskResponseDoneResultOutput
> {
    context: Context;
    task: ITaskDefinition<C, I, O>;
    getRemainingTimeInMills?: () => number;
}

export const createRunner = <
    C extends Context = Context,
    I = ITaskDataInput,
    O extends ITaskResponseDoneResultOutput = ITaskResponseDoneResultOutput
>(
    params: CreateRunnerParams<C, I, O>
) => {
    params.context.plugins.register(createMockTaskTriggerTransportPlugin());
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

    return (
        event: Pick<ITaskEvent, "webinyTaskId"> & Partial<Pick<ITaskEvent, "tenant" | "locale">>
    ) => {
        return runner.run({
            tenant: "root",
            locale: "en-US",
            ...event,
            stateMachineId: "aMockStateMachineId",
            webinyTaskDefinitionId: params.task.id,
            endpoint: "manage",
            executionName: "aMockExecutionName"
        });
    };
};
