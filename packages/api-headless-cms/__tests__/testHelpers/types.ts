import type { ApiCoreContext } from "@webiny/api-core/types/core.js";
import type { GenericRecord } from "@webiny/api/types.js";

export type TestContext = ApiCoreContext;



export interface IQueryParams<T> {
    variables: T;
    headers?: GenericRecord<string, string>;
}

export interface IMutationParams<T> {
    variables: T;
    headers?: GenericRecord<string, string>;
}
