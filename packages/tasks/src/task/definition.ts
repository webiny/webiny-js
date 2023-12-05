import { Context, ITaskDefinition, ITaskField } from "~/types";

interface TaskPluginSetFieldsCallback {
    (fields: ITaskField[]): ITaskField[] | undefined;
}

interface ITaskParams<C extends Context = Context, I = any>
    extends Omit<ITaskDefinition<C, I>, "fields"> {
    fields?: (task: Pick<Task<C, I>, "addField" | "setFields">) => void;
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

    public constructor(task: ITaskParams<C, I>) {
        this.task = {
            ...task,
            fields: []
        };
        if (typeof task.fields === "function") {
            task.fields(this);
        }
    }

    public getTask() {
        return this.task;
    }

    public setFields(cb: TaskPluginSetFieldsCallback) {
        const fields = Array.from(this.task.fields || []);
        this.task.fields = cb(fields);
    }

    public addField(field: ITaskField) {
        this.task.fields = (this.task.fields || []).concat([field]);
    }
}

export type { Task };

export const createTask = <C extends Context = Context, I = any>(params: ITaskParams<C, I>) => {
    return new Task(params);
};

export const createTaskField = (params: ITaskField) => {
    return params;
};
