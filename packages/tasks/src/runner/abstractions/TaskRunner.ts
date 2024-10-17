import { Context } from "~/types";
import { ITaskEvent } from "~/handler/types";
import { IResponseResult } from "~/response/abstractions";

export interface IIsCloseToTimeoutCallable {
    (seconds?: number): boolean;
}

export interface ITaskRunner<C extends Context = Context> {
    context: C;
    isCloseToTimeout: IIsCloseToTimeoutCallable;
    run(event: ITaskEvent): Promise<IResponseResult>;
}
