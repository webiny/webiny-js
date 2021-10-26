import { CmsContext } from "@webiny/api-headless-cms/types";
import WebinyError from "@webiny/error";
import configurations from "../configurations";
import { Table } from "dynamodb-toolbox";

export default (context: CmsContext): Table => {
    const { db } = context;
    const driver = db.driver as any;
    if (!driver || !driver.documentClient) {
        throw new WebinyError(
            `Missing documentDriver on the context.db.driver property.`,
            "DOCUMENT_CLIENT_ERROR"
        );
    }
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
        DocumentClient: driver.documentClient
    });
};
