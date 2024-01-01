import { IResponseResult } from "~/response/abstractions";
import { ITaskData, ITaskDataValues, ITaskDefinition } from "~/types";

export interface ITaskManager<T = ITaskDataValues> {
    run: (definition: ITaskDefinition, task: ITaskData<T>) => Promise<IResponseResult>;
}
