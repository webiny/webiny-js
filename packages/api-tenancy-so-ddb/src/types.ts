import { DocumentClient } from "aws-sdk/clients/dynamodb";
import { PluginsContainer } from "@webiny/plugins";

/**
 * @internal
 * @private
 */
export type DbItem<T> = T & {
    PK: string;
    SK: string;
    GSI1_PK?: string;
    GSI1_SK?: string;
};

export interface TenancyStorageParams {
    table: string;
    documentClient: DocumentClient;
    plugins?: PluginsContainer;
}

export interface TenancySystem {
    version: string;
}

export interface SystemStorageParams {
    table: string;
    documentClient: DocumentClient;
    plugins?: PluginsContainer;
}
