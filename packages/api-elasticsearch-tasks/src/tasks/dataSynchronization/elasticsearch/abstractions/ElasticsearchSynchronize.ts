import { PrimitiveValue } from "@webiny/api-elasticsearch/types";

export interface IElasticsearchSynchronizeExecuteParamsItem {
    PK: string;
    SK: string;
}

export interface IElasticsearchSynchronizeExecuteParams {
    done: boolean;
    index: string;
    totalCount: number;
    items: IElasticsearchSynchronizeExecuteParamsItem[];
    cursor?: PrimitiveValue[];
}

export interface IElasticsearchSynchronizeExecuteResponse {
    done: boolean;
    totalCount: number;
    cursor?: PrimitiveValue[];
}
export interface IElasticsearchSynchronize {
    execute(
        params: IElasticsearchSynchronizeExecuteParams
    ): Promise<IElasticsearchSynchronizeExecuteResponse>;
}
