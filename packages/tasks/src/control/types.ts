import { ITaskRunner } from "~/runner/abstractions";
import { Context } from "~/types";
import { IResponse } from "~/response/abstractions";

export interface ITaskControl {
    runner: ITaskRunner;
    response: IResponse;
    context: Context;
}
