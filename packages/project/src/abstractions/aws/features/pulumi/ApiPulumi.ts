import { createAbstraction } from "~/abstractions/createAbstraction.js";
import type { ApiPulumiApp } from "./pulumiTypes.js";

export interface IApiPulumi {
    execute(app: ApiPulumiApp): void | Promise<void>;
}

export const ApiPulumi = createAbstraction<IApiPulumi>("ApiPulumi");

export namespace ApiPulumi {
    export type Interface = IApiPulumi;
    export type Params = ApiPulumiApp;
}
