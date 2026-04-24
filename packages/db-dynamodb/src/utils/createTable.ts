import type { ITable } from "~/utils/table/index.js";
import { Table } from "~/utils/table/index.js";
import type { TableConstructor } from "~/toolbox.js";

export interface ICreateTableParamsIndexDefinition {
    partitionKey: string;
    sortKey?: string;
}

// export interface ICreateTableParams {
//     name?: string;
//     documentClient: DynamoDBDocument;
//     indexes?: GenericRecord<string, ICreateTableParamsIndexDefinition>;
// }

export type ICreateTableParams = Partial<
    Omit<TableConstructor<string, string, string>, "DocumentClient">
> & {
    name: string;
    documentClient: Pick<
        TableConstructor<string, string, string>,
        "DocumentClient"
    >["DocumentClient"];
};

export const createTable = (params: ICreateTableParams): ITable<string, "PK", "SK"> => {
    const { documentClient, indexes = {}, ...rest } = params;
    return new Table({
        partitionKey: "PK",
        sortKey: "SK",
        DocumentClient: documentClient,
        indexes: {
            GSI_TENANT: {
                partitionKey: "GSI_TENANT"
            },
            GSI1: {
                partitionKey: "GSI1_PK",
                sortKey: "GSI1_SK"
            },
            GSI2: {
                partitionKey: "GSI2_PK",
                sortKey: "GSI2_SK"
            },
            ...indexes
        },
        autoExecute: true,
        autoParse: true,
        ...rest
    });
};
