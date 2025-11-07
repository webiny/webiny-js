import { Abstraction } from "@webiny/di";
import { type IAppModel } from "~/abstractions/models/index.js";
import { type AppName } from "~/abstractions/types.js";

type IGetAppParams = AppName;

type IGetApp = {
    execute(appName: IGetAppParams): IAppModel;
};

export const GetApp = new Abstraction<IGetApp>("GetApp");

export namespace GetApp {
    export type Interface = IGetApp;
    export type Params = AppName;
    export type AppName = IGetAppParams;
}
