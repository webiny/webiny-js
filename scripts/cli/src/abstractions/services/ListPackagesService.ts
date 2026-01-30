import { Abstraction } from "@webiny/di";
import { IPathModel } from "../models";
import { PackageJson } from "type-fest";

export type WebinyPackageJson = PackageJson;

export interface IListPackagesPackage {
    name: string;
    paths: {
        packageFolder: IPathModel;
        packageJsonFile: IPathModel;
        webinyConfigFile: IPathModel;
    };
    packageJson: WebinyPackageJson;
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
