import { Table } from "dynamodb-toolbox";
import { getDocumentClient, getTable } from "~/operations/utils";
import { FileManagerContext } from "@webiny/api-file-manager/types";

export default (params: { context: FileManagerContext }): Table => {
    const { context } = params;
    return new Table({
        name: process.env.DB_TABLE || getTable(context),
        partitionKey: "PK",
        sortKey: "SK",
        DocumentClient: getDocumentClient(context)
    });
};
