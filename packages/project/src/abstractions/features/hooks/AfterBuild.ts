import { Abstraction } from "@webiny/di";
import { type BuildApp } from "~/abstractions/index.js";

export interface IAfterBuild {
    execute(params: BuildApp.Params): void | Promise<void>;
}

export const AfterBuild = new Abstraction<IAfterBuild>("AfterBuild");

export namespace AfterBuild {
    export type Interface = IAfterBuild;
    export type Params = BuildApp.Params;
}
