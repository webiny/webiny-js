/**
 * We use this definition to search for a value in any given field that was passed.
 * It works as an "OR" condition.
 */
export interface DynamoDbContainsFilter {
    fields: string[];
    value: string;
}

export interface ProcessStatementArgsParam {
    expression: string;
    attributeNames: Record<string, any>;
    attributeValues: Record<string, any>;
}
export interface ProcessStatementQueryParam {
    [key: string]: any;
}
export interface ProcessStatementParams {
    args: ProcessStatementArgsParam;
    query: ProcessStatementQueryParam;
}

export interface ProcessStatementCallable {
    (params: ProcessStatementParams): void;
}

export interface Query {
    [key: string]: string;
}
export interface QueryKeyField {
    name: string;
}
export interface QueryKey {
    fields: QueryKeyField[];
    primary?: boolean;
    unique?: boolean;
    name: string;
}
export type QueryKeys = QueryKey[];

export type QuerySort = Record<string, -1 | 1>;

export type DbItem<TData extends Record<string, any> = Record<string, any>> = {
    PK: string;
    SK: string;
    GSI1_PK: string;
    GSI1_SK: string;
    TYPE: string;
    data: TData;
};
