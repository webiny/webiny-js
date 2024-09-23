import { Plugin } from "@webiny/plugins";
import { Context, ITask } from "~/types";
import { GenericRecord } from "@webiny/api/types";

export interface ITaskTriggerTransportPluginParams {
    context: Context;
    getTenant(): string;
    getLocale(): string;
}

export type ITaskTriggerTransportTask = Pick<ITask, "id" | "definitionId">;

export interface ITaskTriggerTransport<T = GenericRecord> {
    send(task: ITaskTriggerTransportTask, delay: number): Promise<T>;
}

export abstract class TaskTriggerTransportPlugin<T = GenericRecord> extends Plugin {
    public static override readonly type: string = "tasks.taskTriggerTransport";

    public abstract createTransport(
        params: ITaskTriggerTransportPluginParams
    ): ITaskTriggerTransport<T>;
}
