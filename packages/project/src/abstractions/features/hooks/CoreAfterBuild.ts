import { createAbstraction } from "~/abstractions/createAbstraction.js";
import { type BuildApp } from "~/abstractions/index.js";

export interface ICoreAfterBuild {
    execute(params: BuildApp.Params): void | Promise<void>;
}

export const CoreAfterBuild = createAbstraction<ICoreAfterBuild>("CoreAfterBuild");

export namespace CoreAfterBuild {
    export type Interface = ICoreAfterBuild;
    export type Params = BuildApp.Params;
}
