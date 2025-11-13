import { createAbstraction } from "~/abstractions/createAbstraction.js";
import { type IAppModel } from "~/abstractions/models/index.js";
import { type AppName } from "~/abstractions/types.js";

type IGetAppParams = AppName;

type IGetApp = {
    execute(appName: IGetAppParams): IAppModel;
};

export const GetApp = createAbstraction<IGetApp>("GetApp");

export namespace GetApp {
    export type Interface = IGetApp;
    export type Params = AppName;
    export type AppName = IGetAppParams;
}
