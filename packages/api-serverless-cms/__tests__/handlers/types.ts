import { GenericRecord } from "@webiny/api/types";

export type PathType =
    | `/cms/manage/${string}`
    | `/cms/read/${string}`
    | `/cms/preview/${string}`
    | "/graphql";

export interface IInvokeCbParams {
    httpMethod?: "POST" | "GET" | "OPTIONS";
    body: {
        query: string;
        variables?: GenericRecord<string>;
    };
    headers?: GenericRecord<string, string>;
}

export type IInvokeCbResult<T> = [T, string];

export interface IInvokeCb<T = unknown> {
    (params: IInvokeCbParams): Promise<IInvokeCbResult<T>>;
}
