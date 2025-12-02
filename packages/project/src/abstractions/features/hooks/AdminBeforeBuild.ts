import { createAbstraction } from "~/abstractions/createAbstraction.js";
import { type BuildApp } from "~/abstractions/index.js";

export interface IAdminBeforeBuild {
    execute(params: BuildApp.Params): void | Promise<void>;
}

export const AdminBeforeBuild = createAbstraction<IAdminBeforeBuild>("AdminBeforeBuild");

export namespace AdminBeforeBuild {
    export type Interface = IAdminBeforeBuild;
    export type Params = BuildApp.Params;
}
