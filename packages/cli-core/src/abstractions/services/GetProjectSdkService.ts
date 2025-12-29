import { createAbstraction } from "~/abstractions/createAbstraction.js";
import { type ProjectSdk } from "@webiny/project";

export interface IGetProjectSdkParams {
    env?: string;
    variant?: string;
    region?: string;
}

export interface IGetProjectSdkService {
    execute(params?: IGetProjectSdkParams): Promise<ProjectSdk>;
}

export const GetProjectSdkService =
    createAbstraction<IGetProjectSdkService>("GetProjectSdkService");

export namespace GetProjectSdkService {
    export type Interface = IGetProjectSdkService;
    export type Params = IGetProjectSdkParams;
}
