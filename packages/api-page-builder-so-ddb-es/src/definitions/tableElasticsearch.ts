import { Table } from "dynamodb-toolbox";
import configurations from "~/operations/configurations";
import { PbContext } from "@webiny/api-page-builder/graphql/types";
import { getDocumentClient } from "@webiny/db-dynamodb/utils/documentClient";
import WebinyError from "@webiny/error";

export const defineTableElasticsearch = (params: { context: PbContext }): Table => {
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
