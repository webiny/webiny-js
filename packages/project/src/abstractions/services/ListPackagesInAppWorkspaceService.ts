import { createAbstraction } from "~/abstractions/createAbstraction.js";
import { type AppName } from "~/abstractions/types.js";

export interface IListPackagesInAppWorkspacePackage {
    name: string;
    webinyConfig: Record<string, any>;
    paths: {
        packageFolder: string;
        webinyConfigFile: string;
    };
}

export type IListPackagesInAppWorkspaceServiceResult = Promise<
    IListPackagesInAppWorkspacePackage[]
>;

export interface IListPackagesInAppWorkspaceService {
    execute(app: AppName): IListPackagesInAppWorkspaceServiceResult;
}

export const ListPackagesInAppWorkspaceService =
    createAbstraction<IListPackagesInAppWorkspaceService>("ListPackagesInAppWorkspaceService");

export namespace ListPackagesInAppWorkspaceService {
    export type Interface = IListPackagesInAppWorkspaceService;
    export type Result = IListPackagesInAppWorkspacePackage[];
}
