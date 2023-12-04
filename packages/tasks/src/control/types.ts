import { ITaskRunner } from "~/runner/types";
import { Context, IResponseManager } from "~/types";

export interface ITaskControl {
    runner: ITaskRunner;
    response: IResponseManager;
    context: Context;
}

export interface ITaskControlParams {
    runner: ITaskRunner;
    context: Context;
    response: IResponseManager;
}
