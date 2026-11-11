import { createAbstraction } from "~/abstractions/createAbstraction.js";
import type { PulumiOptions } from "~/abstractions/pulumiTypes.js";
import { type IAppModel } from "~/abstractions/models/index.js";

type IPulumiOptions = PulumiOptions;

export type IPulumiLoginServiceParams = Partial<{
    app?: IAppModel;
    pulumiOptions: PulumiOptions;
}>;

export interface IPulumiLoginService {
    execute(app: IAppModel): Promise<{ login: string }>;
}

export const PulumiLoginService = createAbstraction<IPulumiLoginService>("PulumiLoginService");

export namespace PulumiLoginService {
    export type Interface = IPulumiLoginService;
    export type Params = IPulumiLoginServiceParams;
    export type Options = IPulumiOptions;
}
