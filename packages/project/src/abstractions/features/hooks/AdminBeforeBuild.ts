import { Abstraction } from "@webiny/di";
import { type BuildApp } from "~/abstractions/index.js";

export interface IAdminBeforeBuild {
    execute(params: BuildApp.Params): void | Promise<void>;
}

export const AdminBeforeBuild = new Abstraction<IAdminBeforeBuild>("AdminBeforeBuild");

export namespace AdminBeforeBuild {
    export type Interface = IAdminBeforeBuild;
    export type Params = BuildApp.Params;
}
