import { createAbstraction } from "@webiny/project/abstractions/createAbstraction.js";

export interface IApiGqlClientResponse<T = any> {
    data?: T;
    errors?: Array<{
        message: string;
        code?: string;
        data?: any;
    }>;
}

export interface IApiGqlClient {
    query<T = any>(params: {
        query: string;
        variables?: Record<string, any>;
    }): Promise<IApiGqlClientResponse<T>>;
    mutation<T = any>(params: {
        mutation: string;
        variables?: Record<string, any>;
    }): Promise<IApiGqlClientResponse<T>>;
}

export const ApiGqlClient = createAbstraction<IApiGqlClient>("ApiGqlClient");

export namespace ApiGqlClient {
    export type Interface = IApiGqlClient;
    export type Response<T = any> = IApiGqlClientResponse<T>;
}
