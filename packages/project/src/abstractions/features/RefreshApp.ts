import { createAbstraction } from "~/abstractions/createAbstraction.js";
import { type AppName } from "~/abstractions/types.js";
import { type PulumiProcess } from "~/abstractions/pulumiTypes.js";

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
