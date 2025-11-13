import { createAbstraction } from "~/abstractions/createAbstraction.js";
import { type BuildApp } from "~/abstractions/index.js";

export interface ICoreBeforeBuild {
    execute(params: BuildApp.Params): void | Promise<void>;
}

export const CoreBeforeBuild = createAbstraction<ICoreBeforeBuild>("CoreBeforeBuild");

export namespace CoreBeforeBuild {
    export type Interface = ICoreBeforeBuild;
    export type Params = BuildApp.Params;
}
