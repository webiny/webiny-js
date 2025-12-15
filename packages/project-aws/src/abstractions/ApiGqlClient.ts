import { createAbstraction } from "@webiny/project/abstractions/createAbstraction";
import { type IBaseAppParams } from "@webiny/project/abstractions/types";

export interface IApiGqlClientQueryParams {
    query: string;
    variables?: Record<string, any>;
    context?: Partial<IBaseAppParams>;
}

export interface IApiGqlClientMutationParams {
    mutation: string;
    variables?: Record<string, any>;
    context?: Partial<IBaseAppParams>;
}

export interface IApiGqlClientResponse<T = any> {
    data?: T;
    errors?: Array<{
        message: string;
        code?: string;
        data?: any;
    }>;
}

export interface IApiGqlClient {
    query<T = any>(params: IApiGqlClientQueryParams): Promise<IApiGqlClientResponse<T>>;
    mutation<T = any>(params: IApiGqlClientMutationParams): Promise<IApiGqlClientResponse<T>>;
}

export const ApiGqlClient = createAbstraction<IApiGqlClient>("ApiGqlClient");

export namespace ApiGqlClient {
    export type Interface = IApiGqlClient;
    export type QueryParams = IApiGqlClientQueryParams;
    export type MutationParams = IApiGqlClientMutationParams;
    export type Response<T = any> = IApiGqlClientResponse<T>;
}

