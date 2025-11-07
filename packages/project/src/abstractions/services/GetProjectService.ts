import { Abstraction } from "@webiny/di";
import { type IProjectModel } from "~/abstractions/models/index.js";

type IGetProjectServiceResult = IProjectModel;

interface IGetProjectService {
    execute(cwd?: string): IGetProjectServiceResult;
}

export const GetProjectService = new Abstraction<IGetProjectService>("GetProjectService");

export namespace GetProjectService {
    export type Interface = IGetProjectService;
    export type Result = IGetProjectServiceResult;
}
