import { Context } from "~/types";
import { ITaskEvent } from "~/handler/types";
import { IResponseResult } from "~/response/abstractions";
import { ITimer } from "~/timer";

export interface ITaskRunner<C extends Context = Context> {
    context: C;
    isCloseToTimeout(seconds?: number): boolean;
    getTimer(): ITimer;
    run(event: ITaskEvent): Promise<IResponseResult>;
}
