import { Context, ITaskDefinition, TaskField } from "~/types";

interface TaskPluginSetFieldsCallback {
    (fields: TaskField[]): TaskField[] | undefined;
}

class Task<C extends Context = Context, I = any> implements ITaskDefinition<C, I> {
    private readonly task: ITaskDefinition<C, I>;

    public get id() {
        return this.task.id;
    }

    public get name() {
        return this.task.name;
    }

    public get fields() {
        return this.task.fields;
    }

    public get run() {
        return this.task.run;
    }

    public get onDone() {
        return this.task.onDone;
    }

    private constructor(task: ITaskDefinition<C, I>) {
        this.task = task;
    }

    public static create<C extends Context = Context, I = any>(task: ITaskDefinition<C, I>) {
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

export const createTask = <C extends Context = Context, I = any>(params: ITaskDefinition<C, I>) => {
    return Task.create<C, I>(params);
};

export const createTaskField = (params: TaskField) => {
    return params;
};
