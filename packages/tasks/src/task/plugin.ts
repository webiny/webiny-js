import { Plugin } from "@webiny/plugins";
import { Context, ITask } from "~/types";

export class TaskPlugin<C extends Context = Context, I = any> extends Plugin {
    public static override readonly type: string = "webiny.backgroundTask";

    private readonly task: ITask<C, I>;

    public constructor(task: ITask<C, I>) {
        super();
        this.task = task;
    }

    public getTask() {
        return this.task;
    }
}

export const createRegisterTaskPlugin = <C extends Context = Context, I = any>(
    task: ITask<C, I>
) => {
    return new TaskPlugin<C, I>(task);
};
