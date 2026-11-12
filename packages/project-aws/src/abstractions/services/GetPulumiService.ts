import { createAbstraction } from "@webiny/project/abstractions/createAbstraction.js";
import type { Pulumi } from "@webiny/pulumi-sdk";
import type { Options as PulumiOptions } from "@webiny/pulumi-sdk";
import { type IAppModel } from "@webiny/project/abstractions/models/index.js";

type IPulumi = Pulumi;
type IPulumiOptions = PulumiOptions;

export type IGetPulumiServiceParams = Partial<{
    app?: IAppModel;
    pulumiOptions: PulumiOptions;
}>;

export interface IGetPulumiService {
    execute(params?: IGetPulumiServiceParams): Promise<Pulumi>;
}

export const GetPulumiService = createAbstraction<IGetPulumiService>("GetPulumiService");

export namespace GetPulumiService {
    export type Interface = IGetPulumiService;
    export type Params = IGetPulumiServiceParams;
    export type Pulumi = IPulumi;
    export type Options = IPulumiOptions;
}
