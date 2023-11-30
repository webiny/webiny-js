import { Context, ITask, TaskField } from "~/types";

interface TaskPluginSetFieldsCallback {
    (fields: TaskField[]): TaskField[] | undefined;
}

class Task<C extends Context = Context, I = any> {
    private readonly task: ITask<C, I>;

    private constructor(task: ITask<C, I>) {
        this.task = task;
    }

    public static create<C extends Context = Context, I = any>(task: ITask<C, I>) {
        return new Task<C, I>(task);
    }

    public getTask() {
        return this.task;
    }

    public setFields(cb: TaskPluginSetFieldsCallback) {
        const fields = Array.from(this.task.fields || []);
        this.task.fields = cb(fields);
    }

    public addField(field: TaskField) {
        this.task.fields = (this.task.fields || []).concat([field]);
    }
}

export type { Task };

export const createTask = <C extends Context = Context, I = any>(params: ITask<C, I>) => {
    return Task.create<C, I>(params);
};

export const createTaskField = (params: TaskField) => {
    return params;
};
