import { createAbstraction } from "@webiny/feature/api";

export interface IElasticsearchSynchronizeExecuteParamsItem {
    PK: string;
    SK: string;
    _id: string;
    index: string;
}

export interface IElasticsearchSynchronizeExecuteParams {
    done: boolean;
    index: string;
    items: IElasticsearchSynchronizeExecuteParamsItem[];
}

export interface IElasticsearchSynchronizeExecuteResponse {
    done: boolean;
}

export interface IElasticsearchSynchronize {
    execute(
        params: IElasticsearchSynchronizeExecuteParams
    ): Promise<IElasticsearchSynchronizeExecuteResponse>;
}

export const ElasticsearchSynchronize = createAbstraction<IElasticsearchSynchronize>(
    "ElasticsearchSynchronize"
);

export namespace ElasticsearchSynchronize {
    export type Interface = IElasticsearchSynchronize;
}
