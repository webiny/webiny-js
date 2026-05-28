import type { IResponseError } from "./ResponseErrorResult.js";
import { TaskDefinition } from "@webiny/api-core/features/task/TaskDefinition/index.js";

export interface ITaskResponseContinueOptionsUntil {
    date: Date;
}
export interface ITaskResponseContinueOptionsSeconds {
    seconds: number;
}

export type ITaskResponseContinueOptions =
    | ITaskResponseContinueOptionsUntil
    | ITaskResponseContinueOptionsSeconds;

export interface ITaskResponse<
    I extends TaskDefinition.TaskInput = TaskDefinition.TaskInput,
    O extends TaskDefinition.TaskOutput = TaskDefinition.TaskOutput
> {
    done(output?: O): TaskDefinition.ResultDone<O>;
    done(message?: string, output?: O): TaskDefinition.ResultDone<O>;
    continue(data: I, options?: ITaskResponseContinueOptions): TaskDefinition.ResultContinue<I>;
    error(error: IResponseError | Error | string): TaskDefinition.ResultError;
    aborted(): TaskDefinition.ResultAborted;
}
