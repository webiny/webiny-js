import { ITaskRunner } from "~/runner/abstractions";
import { IResponse, IResponseResult } from "~/response/abstractions";
import { Context } from "~/types";
import { ITaskEvent } from "~/handler/types";

export interface ITaskControl {
    runner: ITaskRunner;
    response: IResponse;
    context: Context;

    run(event: ITaskEvent): Promise<IResponseResult>;
}
