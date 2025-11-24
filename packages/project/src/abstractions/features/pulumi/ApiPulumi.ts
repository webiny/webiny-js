import { createAbstraction } from "~/abstractions/createAbstraction.js";

export interface IApiPulumi<TApp> {
    execute(app: TApp): void | Promise<void>;
}

export const ApiPulumi = createAbstraction<IApiPulumi<unknown>>("ApiPulumi");

export namespace ApiPulumi {
    export type Interface = IApiPulumi<unknown>;
    export type Params = unknown;
}
