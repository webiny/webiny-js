import { ITaskRunner } from "~/runner/abstractions";
import { IResponse } from "~/response/abstractions";
import { Context } from "~/types";

export interface ITaskControl {
    runner: ITaskRunner;
    response: IResponse;
    context: Context;
}
