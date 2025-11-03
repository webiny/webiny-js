import { Abstraction } from "@webiny/di";
import { type BuildApp } from "~/abstractions/index.js";

export interface IAdminAfterBuild {
    execute(params: BuildApp.Params): void | Promise<void>;
}

export const AdminAfterBuild = new Abstraction<IAdminAfterBuild>("AdminAfterBuild");

export namespace AdminAfterBuild {
    export type Interface = IAdminAfterBuild;
    export type Params = BuildApp.Params;
}
