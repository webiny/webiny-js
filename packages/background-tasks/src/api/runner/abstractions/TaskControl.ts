import type { ITaskRunner } from "~/api/runner/abstractions/index.js";
import type { IResponse, IResponseResult } from "~/api/response/abstractions/index.js";
import type { Context } from "~/api/types.js";
import type { ITaskEvent } from "~/api/handler/types.js";

export interface ITaskControl {
    runner: ITaskRunner;
    response: IResponse;
    context: Context;

    run(event: ITaskEvent): Promise<IResponseResult>;
}
