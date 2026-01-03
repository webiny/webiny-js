import { createAbstraction } from "@webiny/project/abstractions/createAbstraction.js";
import type { ApiPulumiApp } from "~/pulumi/apps/api/index.js";

export interface IApiPulumi {
    execute(app: ApiPulumiApp): void | Promise<void>;
}

export const ApiPulumi = createAbstraction<IApiPulumi>("ApiPulumi");

export namespace ApiPulumi {
    export type Interface = IApiPulumi;
    export type Params = ApiPulumiApp;
}
