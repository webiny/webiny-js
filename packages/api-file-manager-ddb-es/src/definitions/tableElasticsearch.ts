import WebinyError from "@webiny/error";
import { Table } from "dynamodb-toolbox";
import { FileManagerContext } from "~/types";
import { getDocumentClient } from "~/operations/utils";

export interface TableElasticsearchParams {
    context: FileManagerContext;
}
export default (params: TableElasticsearchParams): Table => {
    const { context } = params;
    const tableName = process.env.DB_TABLE_ELASTICSEARCH;

    if (!tableName) {
        throw new WebinyError(
            `Missing Elasticsearch table in the environment.`,
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
