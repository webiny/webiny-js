import { IResponseResult } from "~/response/abstractions";
import { ITaskData, ITaskDataInput, ITaskDefinition } from "~/types";

export interface ITaskManager<T = ITaskDataInput> {
    run: (definition: ITaskDefinition, task: ITaskData<T>) => Promise<IResponseResult>;
}
