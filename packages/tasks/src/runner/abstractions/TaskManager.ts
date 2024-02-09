import { IResponseResult } from "~/response/abstractions";
import { ITask, ITaskDataInput, ITaskDefinition } from "~/types";

export interface ITaskManager<T = ITaskDataInput> {
    run: (definition: ITaskDefinition, task: ITask<T>) => Promise<IResponseResult>;
}
