import { createAbstraction } from "~/abstractions/createAbstraction.js";
import { type BuildApp } from "~/abstractions/index.js";

export interface IApiAfterBuild {
    execute(params: BuildApp.Params): void | Promise<void>;
}

export const ApiAfterBuild = createAbstraction<IApiAfterBuild>("ApiAfterBuild");

export namespace ApiAfterBuild {
    export type Interface = IApiAfterBuild;
    export type Params = BuildApp.Params;
}
