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
    const tableName = configurations.db().table;
    if (!tableName && !db.table) {
        throw new WebinyError(`Missing table on the context.db property.`, "TABLE_NAME_ERROR");
    }
    return new Table({
        name: tableName || db.table,
        partitionKey: "PK",
        sortKey: "SK",
        DocumentClient: driver.documentClient
    });
};
