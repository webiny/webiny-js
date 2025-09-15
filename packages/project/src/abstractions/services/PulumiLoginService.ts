import { Abstraction } from "@webiny/di-container";
import type { Options as PulumiOptions } from "@webiny/pulumi-sdk";
import { type IAppModel } from "~/abstractions/models/index.js";

export type IPulumiLoginServiceParams = Partial<{
    app?: IAppModel;
    pulumiOptions: PulumiOptions;
}>;

export interface IPulumiLoginService {
    execute(app: IAppModel): Promise<{ login: string }>;
}

export const PulumiLoginService = new Abstraction<IPulumiLoginService>("PulumiLoginService");

export namespace PulumiLoginService {
    export type Interface = IPulumiLoginService;
    export type Params = IPulumiLoginServiceParams;
}
