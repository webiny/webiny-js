import { Plugin } from "@webiny/plugins";
import { Context, ITaskDefinition } from "~/types";

export class TaskPlugin<C extends Context = Context, I = any> extends Plugin {
    public static override readonly type: string = "webiny.backgroundTask";

    private readonly task: ITaskDefinition<C, I>;

    public constructor(task: ITaskDefinition<C, I>) {
        super();
        this.task = task;
    }

    public getTask() {
        return this.task;
    }
}

export const createRegisterTaskPlugin = <C extends Context = Context, I = any>(
    task: ITaskDefinition<C, I>
) => {
    return new TaskPlugin<C, I>(task);
};
