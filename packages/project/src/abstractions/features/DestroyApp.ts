import { createAbstraction } from "~/abstractions/createAbstraction.js";
import { type AppName } from "~/abstractions/types.js";
import { type PulumiProcess } from "@webiny/pulumi-sdk";

type IPulumiProcess = PulumiProcess;

interface IDestroyAppParams {
    app: AppName;
}

interface IDestroyApp {
    execute(params: IDestroyAppParams): Promise<{ pulumiProcess: IPulumiProcess }>;
}

export const DestroyApp = createAbstraction<IDestroyApp>("DestroyApp");

export namespace DestroyApp {
    export type Interface = IDestroyApp;

    export type Params = IDestroyAppParams;

    export type PulumiProcess = IPulumiProcess;
}
