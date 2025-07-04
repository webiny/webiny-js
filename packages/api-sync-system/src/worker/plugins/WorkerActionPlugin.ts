import { Plugin } from "@webiny/plugins/Plugin.js";
import type { IWorkerAction, IWorkerActionHandleParams } from "../types";

export class WorkerActionPlugin<T = unknown> extends Plugin {
    public static override readonly type: string = "sync.worker.action";

    private readonly action: IWorkerAction<T>;

    public constructor(action: IWorkerAction<T>) {
        super();
        this.name = action.name;
        this.action = action;
    }

    public parse(input: unknown): T | undefined {
        return this.action.parse(input);
    }

    public handle(params: IWorkerActionHandleParams<T>): Promise<void> {
        return this.action.handle(params);
    }
}

export const createWorkerActionPlugin = <T>(action: IWorkerAction<T>): WorkerActionPlugin<T> => {
    return new WorkerActionPlugin<T>(action);
};
