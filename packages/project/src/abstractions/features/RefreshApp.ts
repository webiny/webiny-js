import { Abstraction } from "@webiny/di-container";
import { type IBaseAppParams } from "~/abstractions/types.js";
import { type ExecaChildProcess } from "execa";

export type IPulumiProcess = ExecaChildProcess<string>;

export type IRefreshAppParams = IBaseAppParams;

interface IRefreshApp {
    execute(params: IRefreshAppParams): Promise<{ pulumiProcess: IPulumiProcess }>;
}

export const RefreshApp = new Abstraction<IRefreshApp>("RefreshApp");

export namespace RefreshApp {
    export type Interface = IRefreshApp;

    export type Params = IRefreshAppParams;

    export type PulumiProcess = IPulumiProcess;
}
