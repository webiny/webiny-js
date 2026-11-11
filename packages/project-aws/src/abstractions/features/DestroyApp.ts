import { createAbstraction } from "@webiny/project/abstractions/createAbstraction.js";
import { type AppName } from "@webiny/project/abstractions/types.js";
import { type PulumiProcess } from "@webiny/pulumi-sdk";

type IPulumiProcess = PulumiProcess;

export interface IDestroyAppParams {
    app: AppName;
}

export interface IDestroyApp {
    execute(params: IDestroyAppParams): Promise<{ pulumiProcess: IPulumiProcess }>;
}

export const DestroyApp = createAbstraction<IDestroyApp>("DestroyApp");

export namespace DestroyApp {
    export type Interface = IDestroyApp;

    export type Params = IDestroyAppParams;

    export type PulumiProcess = IPulumiProcess;
}
