import { createAbstraction } from "@webiny/project/abstractions/createAbstraction";

export interface IGetApiGqlClientResponse<T = any> {
    data?: T;
    errors?: Array<{
        message: string;
        code?: string;
        data?: any;
    }>;
}

export interface IApiGqlClientInstance {
    query<T = any>(params: {
        query: string;
        variables?: Record<string, any>;
    }): Promise<IGetApiGqlClientResponse<T>>;
    mutation<T = any>(params: {
        mutation: string;
        variables?: Record<string, any>;
    }): Promise<IGetApiGqlClientResponse<T>>;
}

export interface IGetApiGqlClient {
    execute(params: { env: string; variant?: string }): Promise<IApiGqlClientInstance>;
}

export const GetApiGqlClient = createAbstraction<IGetApiGqlClient>("GetApiGqlClient");

export namespace GetApiGqlClient {
    export type Interface = IGetApiGqlClient;
    export type Response<T = any> = IGetApiGqlClientResponse<T>;
    export type ClientInstance = IApiGqlClientInstance;
}
