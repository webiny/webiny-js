import { createAbstraction } from "@webiny/project/abstractions/createAbstraction.js";
import type { ApiPulumiApp } from "~/pulumi/apps/api/index.js";

export interface IApiPulumi<TApp = ApiPulumiApp> {
    execute(app: TApp): void | Promise<void>;
}

export const ApiPulumi = createAbstraction<IApiPulumi<ApiPulumiApp>>("ApiPulumi");

export namespace ApiPulumi {
    export type Interface = IApiPulumi<ApiPulumiApp>;
    export type Params = ApiPulumiApp;
}
