import { Plugin } from "@webiny/plugins/Plugin.js";

export interface IWorkerEventHandlerPluginHandleCallableParams {}

export interface IWorkerEventHandlerPluginHandleCallable {
    (params: IWorkerEventHandlerPluginHandleCallableParams): Promise<void>;
}

export interface IWorkerEventHandlerPluginParams {
    handle: IWorkerEventHandlerPluginHandleCallable;
}

export class WorkerEventHandlerPlugin extends Plugin {
    public static override type: string = "sync.worker.eventHandler";

    private readonly config: IWorkerEventHandlerPluginParams;

    public constructor(config: IWorkerEventHandlerPluginParams) {
        super();
        this.config = config;
    }

    public async handle(params: IWorkerEventHandlerPluginHandleCallableParams): Promise<void> {
        return this.config.handle(params);
    }
}

export const createWorkerEventHandlerPlugin = (params: IWorkerEventHandlerPluginParams) => {
    return new WorkerEventHandlerPlugin(params);
};
