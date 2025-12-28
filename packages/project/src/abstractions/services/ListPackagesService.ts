import { createAbstraction } from "~/abstractions/createAbstraction.js";
import { type GetApp } from "~/abstractions/index.js";

export interface IListPackagesServiceParams {
    app?: GetApp.AppName;
    env?: string;
    whitelist?: string[];
}

export interface IListPackagesPackage {
    name: string;
    paths: {
        packageFolder: string;
        webinyConfigFile: string;
    };
}

export type IListPackagesServiceResult = IListPackagesPackage[];

export interface IListPackagesService {
    execute(params: IListPackagesServiceParams): Promise<IListPackagesServiceResult>;
}

export const ListPackagesService = createAbstraction<IListPackagesService>("ListPackagesService");

export namespace ListPackagesService {
    export type Interface = IListPackagesService;
    export type Params = IListPackagesServiceParams;
    export type Package = IListPackagesPackage;
    export type Result = IListPackagesServiceResult;
}
