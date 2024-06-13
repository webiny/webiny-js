import { Plugin } from "@webiny/plugins";
import { Context, ITask, ITaskConfig } from "~/types";
import { PutEventsCommandOutput } from "@webiny/aws-sdk/client-eventbridge";

export { PutEventsCommandOutput };

export interface ITaskTriggerTransportPluginParams {
    context: Context;
    config: ITaskConfig;
    getTenant(): string;
    getLocale(): string;
}

export interface ITaskTriggerTransport {
    send(task: Pick<ITask, "id" | "definitionId">, delay: number): Promise<PutEventsCommandOutput>;
}

export abstract class TaskTriggerTransportPlugin extends Plugin {
    public static override readonly type: string = "tasks.taskTriggerTransport";

    public abstract createTransport(
        params: ITaskTriggerTransportPluginParams
    ): ITaskTriggerTransport;
}
