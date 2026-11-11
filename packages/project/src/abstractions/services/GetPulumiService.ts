import { createAbstraction } from "~/abstractions/createAbstraction.js";
import type { Pulumi, PulumiOptions } from "~/abstractions/pulumiTypes.js";
import { type IAppModel } from "~/abstractions/models/index.js";

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
}
