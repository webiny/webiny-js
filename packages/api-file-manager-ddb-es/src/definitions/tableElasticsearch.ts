import { Table } from "dynamodb-toolbox";
import configurations from "~/operations/configurations";
import { FileManagerContext } from "@webiny/api-file-manager/types";
import WebinyError from "@webiny/error";
import { getDocumentClient } from "~/operations/utils";

export default (params: { context: FileManagerContext }): Table => {
    const { context } = params;
    const tableName = configurations.esDb().table;

    if (!tableName) {
        throw new WebinyError(
            `Missing Elasticsearch table in the configuration.`,
            "TABLE_NAME_ERROR"
        );
    }

    return new Table({
        name: tableName,
        partitionKey: "PK",
        sortKey: "SK",
        DocumentClient: getDocumentClient(context)
    });
};
