import { Table } from "dynamodb-toolbox";
import { getDocumentClient, getTable } from "~/operations/utils";
import { FileManagerContext } from "~/types";

export interface TableParams {
    context: FileManagerContext;
}
export default (params: TableParams): Table => {
    const { context } = params;
    return new Table({
        name: process.env.DB_TABLE_FILE_MANGER || process.env.DB_TABLE || getTable(context),
        partitionKey: "PK",
        sortKey: "SK",
        DocumentClient: getDocumentClient(context),
        indexes: {
            GSI1: {
                partitionKey: "GSI1_PK",
                sortKey: "GSI1_SK"
            }
        }
    });
};
