import { DocumentClient } from "aws-sdk/clients/dynamodb";
import { PluginsContainer } from "@webiny/plugins";

/**
 * @internal
 * @private
 */
export type DbItem<T> = T & {
    PK: string;
    SK: string;
    TYPE: string;
    GSI1_PK?: string;
    GSI1_SK?: string;
};

export interface SecurityStorageParams {
    tenant: string;
    table: string;
    documentClient: DocumentClient;
    plugins: PluginsContainer;
}


