import { Context, ITaskDefinition, ITaskDefinitionField } from "~/types";

export interface ITaskPluginSetFieldsCallback {
    (fields: ITaskDefinitionField[]): ITaskDefinitionField[] | undefined;
}

export interface ITaskDefinitionParams<C extends Context = Context, I = any>
    extends Omit<ITaskDefinition<C, I>, "fields"> {
    config?: (task: Pick<TaskDefinition<C, I>, "addField" | "setFields">) => void;
}

class TaskDefinition<C extends Context = Context, I = any> implements ITaskDefinition<C, I> {
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

    public get onError() {
        return this.task.onError;
    }

    public constructor(task: ITaskDefinitionParams<C, I>) {
        this.task = {
            ...task,
            fields: []
        };
        if (typeof task.config === "function") {
            task.config(this);
        }
    }

    public getTask() {
        return this.task;
    }

    public setFields(cb: ITaskPluginSetFieldsCallback) {
        const fields = Array.from(this.task.fields || []);
        this.task.fields = cb(fields);
    }

    public addField(field: ITaskDefinitionField) {
        this.task.fields = (this.task.fields || []).concat([field]);
    }
}

export type { TaskDefinition };

export const createTaskDefinition = <C extends Context = Context, I = any>(
    params: ITaskDefinitionParams<C, I>
) => {
    return new TaskDefinition(params);
};

export const createTaskDefinitionField = (params: ITaskDefinitionField) => {
    return params;
};
