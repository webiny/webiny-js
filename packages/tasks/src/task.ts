import { Plugin } from "@webiny/plugins";
import { Context, ITask, ITaskParams } from "~/types";

export interface ITaskHandler<C extends Context = Context, T = any> {
    (params: ITaskParams<C, T>): Promise<ITask<C, T>>;
}

export class TaskDefinition<C extends Context = Context, T = any> extends Plugin {
    public static override readonly type: string = "task.definition";
    public readonly taskType: string;
    public readonly handler: ITaskHandler<C, T>;

    public constructor(type: string, handler: ITaskHandler<C, T>) {
        super();
        this.taskType = type;
        this.name = `task.definition.${type}`;
        this.handler = handler;
    }
}

export const createTaskDefinition = <C extends Context = Context, T = any>(
    type: string,
    handler: ITaskHandler<C, T>
): TaskDefinition<C, T> => {
    return new TaskDefinition<C, T>(type, handler);
};
