import camelCase from "lodash/camelCase";
import WebinyError from "@webiny/error";
import { Plugin } from "@webiny/plugins";
import {
    Context,
    ITaskDefinition,
    ITaskDefinitionField,
    ITaskResponseDoneResultOutput
} from "~/types";

/**
 * By default, we will stop iterating through the task after DEFAULT_MAX_ITERATIONS.
 *
 * This mechanism will prevent infinite loops in case of a bug in the task code.
 */
const DEFAULT_MAX_ITERATIONS = 100;

export interface ITaskPluginSetFieldsCallback {
    (fields: ITaskDefinitionField[]): ITaskDefinitionField[] | undefined;
}

export interface ITaskDefinitionParams<
    C extends Context = Context,
    I = any,
    O extends ITaskResponseDoneResultOutput = ITaskResponseDoneResultOutput
> extends Omit<ITaskDefinition<C, I, O>, "fields" | "maxIterations"> {
    config?: (task: Pick<TaskDefinitionPlugin<C, I, O>, "addField" | "setFields">) => void;
    maxIterations?: number;
}

export class TaskDefinitionPlugin<
        C extends Context = Context,
        I = any,
        O extends ITaskResponseDoneResultOutput = ITaskResponseDoneResultOutput
    >
    extends Plugin
    implements ITaskDefinition<C, I, O>
{
    public static override readonly type: string = "webiny.backgroundTask";

    public readonly isPrivate: boolean;

    private readonly task: ITaskDefinition<C, I, O>;

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

    public get onAbort() {
        return this.task.onAbort;
    }

    public get onError() {
        return this.task.onError;
    }

    public get onMaxIterations() {
        return this.task.onMaxIterations;
    }

    public get maxIterations(): number {
        return this.task.maxIterations || DEFAULT_MAX_ITERATIONS;
    }

    public constructor(task: ITaskDefinitionParams<C, I, O>) {
        super();
        this.isPrivate = task.isPrivate || false;
        this.task = {
            ...task,
            maxIterations: task.maxIterations || DEFAULT_MAX_ITERATIONS,
            fields: []
        };
        if (typeof task.config === "function") {
            task.config(this);
        }
        this.validate();
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
    /**
     * TODO implement zod validation if validation becomes too complex
     */
    private validate(): void {
        if (camelCase(this.task.id) !== this.task.id) {
            /**
             * We want to log and throw the message so it can be seen in the CloudWatch logs.
             */
            const message = `Task ID "${this.task.id}" is invalid. It must be in camelCase format, for example: "myCustomTask".`;
            console.log(message);
            throw new WebinyError(message);
        }
    }
}

export const createTaskDefinition = <
    C extends Context = Context,
    I = any,
    O extends ITaskResponseDoneResultOutput = ITaskResponseDoneResultOutput
>(
    params: ITaskDefinitionParams<C, I, O>
) => {
    return new TaskDefinitionPlugin<C, I, O>(params);
};

export const createPrivateTaskDefinition = <
    C extends Context = Context,
    I = any,
    O extends ITaskResponseDoneResultOutput = ITaskResponseDoneResultOutput
>(
    params: ITaskDefinitionParams<C, I, O>
) => {
    return new TaskDefinitionPlugin<C, I, O>({
        ...params,
        isPrivate: true
    });
};

export const createTaskDefinitionField = (params: ITaskDefinitionField) => {
    return params;
};
