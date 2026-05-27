import type { Context } from "~/api/types.js";
import type { ITaskEvent } from "~/api/handler/types.js";
import type { IResponseResult } from "~/api/response/abstractions/index.js";
import type { ITimer } from "@webiny/handler-aws";

export interface IIsCloseToTimeoutCallable {
    (seconds?: number): boolean;
}

export interface ITaskRunner<C extends Context = Context> {
    context: C;
    isCloseToTimeout: IIsCloseToTimeoutCallable;
    timer: ITimer;
    run(event: ITaskEvent): Promise<IResponseResult>;
}
