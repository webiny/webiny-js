import { Abstraction } from "@webiny/di";
import type { Pulumi, Options as PulumiOptions } from "@webiny/pulumi-sdk";
import { type IAppModel } from "~/abstractions/models/index.js";

export type IGetPulumiServiceParams = Partial<{
    app?: IAppModel;
    pulumiOptions: PulumiOptions;
}>;

export interface IGetPulumiService {
    execute(params?: IGetPulumiServiceParams): Promise<Pulumi>;
}

export const GetPulumiService = new Abstraction<IGetPulumiService>("GetPulumiService");

export namespace GetPulumiService {
    export type Interface = IGetPulumiService;
    export type Params = IGetPulumiServiceParams;
}
