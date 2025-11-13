import { createAbstraction } from "~/abstractions/createAbstraction.js";
import { type IAppModel } from "~/abstractions/models/index.js";
import { type AppName } from "~/abstractions/types.js";

type IGetAppServiceParams = AppName;

type IGetAppServiceResult = IAppModel;

interface IGetAppService {
    execute(appName: IGetAppServiceParams): IGetAppServiceResult;
}

export const GetAppService = createAbstraction<IGetAppService>("GetAppService");

export namespace GetAppService {
    export type Interface = IGetAppService;
    export type Params = IGetAppServiceParams;
    export type Result = IGetAppServiceResult;
}
