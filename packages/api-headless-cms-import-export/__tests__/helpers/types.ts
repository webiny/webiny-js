import { GenericRecord } from "@webiny/api/types";

export interface InvokeParams {
    httpMethod?: "POST" | "GET" | "OPTIONS";
    body?: {
        query: string;
        variables?: GenericRecord<string>;
    };
    headers?: GenericRecord<string, string>;
}

export interface IInvokeCb {
    <T = any>(params: InvokeParams): Promise<[T, any]>;
}
