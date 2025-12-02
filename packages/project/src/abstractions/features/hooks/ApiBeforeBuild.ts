import { createAbstraction } from "~/abstractions/createAbstraction.js";
import { type BuildApp } from "~/abstractions/index.js";

export interface IApiBeforeBuild {
    execute(params: BuildApp.Params): void | Promise<void>;
}

export const ApiBeforeBuild = createAbstraction<IApiBeforeBuild>("ApiBeforeBuild");

export namespace ApiBeforeBuild {
    export type Interface = IApiBeforeBuild;
    export type Params = BuildApp.Params;
}
