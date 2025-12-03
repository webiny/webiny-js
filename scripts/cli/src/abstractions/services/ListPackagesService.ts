import { Abstraction } from "@webiny/di";
import { IPathModel } from "../models";
import { PackageJson } from "type-fest";

export type ExportPath = string;

export interface IWebinyPackageExportSettings {
    exportPath: ExportPath;
    namedExports?: string[];
}

export type WebinyPackageJson = PackageJson & {
    webiny?: {
        exports?: Record<string, ExportPath | IWebinyPackageExportSettings>;
    };
};

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
    export type WebinyPackageExportSettings = IWebinyPackageExportSettings;
    export type Result = IListPackagesServiceResult;
}
