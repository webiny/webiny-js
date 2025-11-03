import { Abstraction } from "@webiny/di";
import { type IBaseAppParams } from "~/abstractions/types.js";
import { type ExecaChildProcess } from "execa";

type IPulumiProcess = ExecaChildProcess<string>;

interface IDestroyAppParams extends IBaseAppParams {
    debug?: boolean;
}

interface IDestroyApp {
    execute(params: IDestroyAppParams): Promise<{ pulumiProcess: IPulumiProcess }>;
}

export const DestroyApp = new Abstraction<IDestroyApp>("DestroyApp");

export namespace DestroyApp {
    export type Interface = IDestroyApp;

    export type Params = IDestroyAppParams;

    export type PulumiProcess = IPulumiProcess;
}
