import { Abstraction } from "@webiny/di";
import { type IProjectModel } from "~/abstractions/models/index.js";

interface IGetProject {
    execute(cwd?: string): IProjectModel;
}

export const GetProject = new Abstraction<IGetProject>("GetProject");

export namespace GetProject {
    export type Interface = IGetProject;
    export type Project = IProjectModel;
}
