import WebinyError from "@webiny/error";
import { I18NContext } from "@webiny/api-i18n/types";
import { DocumentClient } from "aws-sdk/clients/dynamodb";

export const getDocumentClient = (context: I18NContext): DocumentClient => {
    const driver = context.db?.driver as any;
    if (!driver?.documentClient) {
        throw new WebinyError(
            `Missing documentDriver on the context db.driver property.`,
            "DOCUMENT_CLIENT_ERROR"
        );
    }
    return driver.documentClient;
};

export const getTable = (context: I18NContext): string => {
    const db = context.db as any;
    if (!db) {
        throw new WebinyError("Missing db on context.", "DB_ERROR");
    } else if (!db.table) {
        throw new WebinyError("Missing table on context.db.", "TABLE_ERROR");
    }
    return db.table;
};
