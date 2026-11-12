import { createAbstraction } from "@webiny/project/abstractions/createAbstraction.js";
import { type AppName } from "@webiny/project/abstractions/types.js";
import { type PulumiProcess } from "@webiny/pulumi-sdk";

export type IPulumiProcess = PulumiProcess;

export type IRefreshAppParams = { app: AppName };

interface IRefreshApp {
    execute(params: IRefreshAppParams): Promise<{ pulumiProcess: IPulumiProcess }>;
}

export const RefreshApp = createAbstraction<IRefreshApp>("RefreshApp");

export namespace RefreshApp {
    export type Interface = IRefreshApp;

    export type Params = IRefreshAppParams;

    export type PulumiProcess = IPulumiProcess;
}
