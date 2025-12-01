import { createAbstraction } from "~/abstractions/createAbstraction.js";
import { type IAppModel, type IAppPackageModel } from "~/abstractions/models/index.js";

export interface IGetAppPackagesService {
    execute(app: IAppModel): Promise<IAppPackageModel[]>;
}

export const GetAppPackagesService =
    createAbstraction<IGetAppPackagesService>("GetAppPackagesService");

export namespace GetAppPackagesService {
    export type Interface = IGetAppPackagesService;
}
