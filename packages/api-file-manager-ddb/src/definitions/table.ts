import { Table } from "dynamodb-toolbox";
import configurations from "~/operations/configurations";
import { getDocumentClient, getTable } from "~/operations/utils";
import { FileManagerContext } from "@webiny/api-file-manager/types";

export interface TableParams {
    context: FileManagerContext;
}
export default (params: TableParams): Table => {
    const { context } = params;
    return new Table({
        name: configurations.db().table || getTable(context),
        partitionKey: "PK",
        sortKey: "SK",
        DocumentClient: getDocumentClient(context)
    });
};
