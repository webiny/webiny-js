import { Table } from "dynamodb-toolbox";
import configurations from "~/operations/configurations";
import { getDocumentClient, getTable } from "~/operations/helpers";
import { FileManagerContext } from "@webiny/api-file-manager/types";

export default (params: { context: FileManagerContext }): Table => {
    const { context } = params;
    return new Table({
        name: configurations.db().table || getTable(context),
        partitionKey: "PK",
        sortKey: "SK",
        DocumentClient: getDocumentClient(context)
    });
};
