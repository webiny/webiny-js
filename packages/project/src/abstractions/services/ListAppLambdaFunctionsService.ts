import { createAbstraction } from "~/abstractions/createAbstraction.js";
import { type IAppModel } from "~/abstractions/models/IAppModel.js";

export interface IListAppLambdaFunctionsServiceParams {
    whitelist?: string | string[];
}

export interface IListAppLambdaFunctionsServiceResult {
    list: Array<{
        name: string;
        path: string;
    }>;
    meta: {
        count: number;
        totalCount: number;
    };
}

export interface IListAppLambdaFunctionsService {
    execute(
        app: IAppModel,
        params?: IListAppLambdaFunctionsServiceParams
    ): Promise<IListAppLambdaFunctionsServiceResult>;
}

export const ListAppLambdaFunctionsService = createAbstraction<IListAppLambdaFunctionsService>(
    "ListAppLambdaFunctionsService"
);

export namespace ListAppLambdaFunctionsService {
    export type Interface = IListAppLambdaFunctionsService;
    export type Params = IListAppLambdaFunctionsServiceParams;
    export type Result = IListAppLambdaFunctionsServiceResult;
}
