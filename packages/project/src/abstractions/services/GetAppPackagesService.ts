import { Abstraction } from "@webiny/di";
import { type IAppModel, type IAppPackageModel } from "~/abstractions/models/index.js";

export interface IGetAppPackagesService {
    execute(app: IAppModel): Promise<IAppPackageModel[]>;
}

export const GetAppPackagesService = new Abstraction<IGetAppPackagesService>(
    "GetAppPackagesService"
);

export namespace GetAppPackagesService {
    export type Interface = IGetAppPackagesService;
}
