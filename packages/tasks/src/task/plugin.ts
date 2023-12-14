import { Plugin } from "@webiny/plugins";
import { Context, ITaskDefinition, ITaskDefinitionField } from "~/types";

export interface ITaskPluginSetFieldsCallback {
    (fields: ITaskDefinitionField[]): ITaskDefinitionField[] | undefined;
}

export interface ITaskDefinitionParams<C extends Context = Context, I = any>
    extends Omit<ITaskDefinition<C, I>, "fields"> {
    config?: (task: Pick<TaskDefinitionPlugin<C, I>, "addField" | "setFields">) => void;
}

export class TaskDefinitionPlugin<C extends Context = Context, I = any>
    extends Plugin
    implements ITaskDefinition<C, I>
{
    public static override readonly type: string = "webiny.backgroundTask";

    private readonly task: ITaskDefinition<C, I>;

    public get id() {
        return this.task.id;
    }

    public get title() {
        return this.task.title;
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
        super();
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

export const createTaskDefinition = <C extends Context = Context, I = any>(
    params: ITaskDefinitionParams<C, I>
) => {
    return new TaskDefinitionPlugin(params);
};

export const createTaskDefinitionField = (params: ITaskDefinitionField) => {
    return params;
};
