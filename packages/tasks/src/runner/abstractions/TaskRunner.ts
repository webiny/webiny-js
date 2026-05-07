import type { Context } from "~/types.js";
import type { ITaskEvent } from "~/handler/types.js";
import type { IResponseResult } from "~/response/abstractions/index.js";
import type { ITimer } from "@webiny/handler/timer/index.js";

export interface IIsCloseToTimeoutCallable {
    (seconds?: number): boolean;
}

export interface ITaskRunner<C extends Context = Context> {
    context: C;
    isCloseToTimeout: IIsCloseToTimeoutCallable;
    timer: ITimer;
    run(event: ITaskEvent): Promise<IResponseResult>;
}
