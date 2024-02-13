import {
    Context,
    ITaskDataInput,
    ITaskDefinition,
    ITaskEvent,
    ITaskResponseDoneResultOutput
} from "@webiny/tasks/types";
import { TaskRunner } from "@webiny/tasks/runner";

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
    const runner = new TaskRunner(
        {
            getRemainingTimeInMillis(): number {
                if (!params.getRemainingTimeInMills) {
                    return 5 * 60 * 1000;
                }
                return params.getRemainingTimeInMills();
            }
        },
        params.context
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
