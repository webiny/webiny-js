import { createAbstraction } from "~/abstractions/createAbstraction.js";
import { type ProjectSdk } from "@webiny/project";

export interface IGetProjectSdkService {
    execute(): Promise<ProjectSdk>;
}

export const GetProjectSdkService =
    createAbstraction<IGetProjectSdkService>("GetProjectSdkService");

export namespace GetProjectSdkService {
    export type Interface = IGetProjectSdkService;
}
