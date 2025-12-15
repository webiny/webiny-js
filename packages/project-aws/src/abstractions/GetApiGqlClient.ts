import { createAbstraction } from "@webiny/project/abstractions/createAbstraction";

export interface IGetApiGqlClientQueryParams {
    query: string;
    variables?: Record<string, any>;
    env: string;
    variant?: string;
}

export interface IGetApiGqlClientMutationParams {
    mutation: string;
    variables?: Record<string, any>;
    env: string;
    variant?: string;
}

export interface IGetApiGqlClientResponse<T = any> {
    data?: T;
    errors?: Array<{
        message: string;
        code?: string;
        data?: any;
    }>;
}

export interface IGetApiGqlClient {
    query<T = any>(params: IGetApiGqlClientQueryParams): Promise<IGetApiGqlClientResponse<T>>;
    mutation<T = any>(params: IGetApiGqlClientMutationParams): Promise<IGetApiGqlClientResponse<T>>;
}

export const GetApiGqlClient = createAbstraction<IGetApiGqlClient>("GetApiGqlClient");

export namespace GetApiGqlClient {
    export type Interface = IGetApiGqlClient;
    export type QueryParams = IGetApiGqlClientQueryParams;
    export type MutationParams = IGetApiGqlClientMutationParams;
    export type Response<T = any> = IGetApiGqlClientResponse<T>;
}
