import { createAbstraction } from "~/abstractions/createAbstraction.js";
import { type IProjectModel } from "~/abstractions/models/index.js";

interface IGetProject {
    execute(cwd?: string): IProjectModel;
}

export const GetProject = createAbstraction<IGetProject>("GetProject");

export namespace GetProject {
    export type Interface = IGetProject;
    export type Project = IProjectModel;
}
