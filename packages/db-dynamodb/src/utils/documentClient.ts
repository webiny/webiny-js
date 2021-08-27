import { DocumentClient } from "aws-sdk/clients/dynamodb";
import WebinyError from "@webiny/error";
import { DbContext } from "@webiny/handler-db/types";
import DynamoDbDriver from "~/DynamoDbDriver";

export const getDocumentClient = <T extends DbContext>(context: T): DocumentClient => {
    if (!context.db) {
        throw new WebinyError("Missing db on context.", "DB_ERROR");
    } else if (!context.db.driver) {
        throw new WebinyError(`Missing driver on the context.db property.`, "DRIVER_ERROR");
    }
    const driver = context.db.driver as DynamoDbDriver;
    if (!driver.documentClient) {
        throw new WebinyError(
            `Missing documentClient on the context.db.driver property.`,
            "DOCUMENT_CLIENT_ERROR"
        );
    }
    return driver.documentClient;
};
