import { Abstraction } from "@webiny/di";

export interface IListPackagesPackage {
    name: string;
    paths: {
        packageFolder: string;
        webinyConfigFile: string;
    };
}

export type IListPackagesServiceResult = IListPackagesPackage[];

export interface IListPackagesService {
    execute(): Promise<IListPackagesServiceResult>;
}

export const ListPackagesService = new Abstraction<IListPackagesService>("ListPackagesService");

export namespace ListPackagesService {
    export type Interface = IListPackagesService;
    export type Package = IListPackagesPackage;
    export type Result = IListPackagesServiceResult;
}
