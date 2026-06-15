import { createAbstraction } from "~/abstractions/createAbstraction.js";
import { type IProjectModel } from "~/abstractions/models/index.js";

const a = "sd";

type IGetProjectServiceResult = IProjectModel;

interface IGetProjectService {
    execute(cwd?: string): IGetProjectServiceResult;
}

export const GetProjectService = createAbstraction<IGetProjectService>("GetProjectService");

export namespace GetProjectService {
    export type Interface = IGetProjectService;
    export type Result = IGetProjectServiceResult;
}
