import { Context } from "~/types";
import { ITaskEvent } from "~/handler/types";
import { IResponseResult } from "~/response/abstractions";

export interface ITaskRunner<C extends Context = Context> {
    context: C;
    isCloseToTimeout(seconds?: number): boolean;
    run(event: ITaskEvent): Promise<IResponseResult>;
}
