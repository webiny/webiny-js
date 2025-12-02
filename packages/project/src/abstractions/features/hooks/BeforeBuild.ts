import { createAbstraction } from "~/abstractions/createAbstraction.js";
import { type BuildApp } from "~/abstractions/index.js";

export interface IBeforeBuild {
    execute(params: BuildApp.Params): void | Promise<void>;
}

export const BeforeBuild = createAbstraction<IBeforeBuild>("BeforeBuild");

export namespace BeforeBuild {
    export type Interface = IBeforeBuild;
    export type Params = BuildApp.Params;
}
