import WebinyError from "@webiny/error";
import { FileManagerContext } from "@webiny/api-file-manager/types";
import { DocumentClient } from "aws-sdk/clients/dynamodb";

export const getDocumentClient = (context: FileManagerContext): DocumentClient => {
    const driver = context.db.driver as any;
    if (!driver || !driver.documentClient) {
        throw new WebinyError(
            `Missing documentDriver on the context db.driver property.`,
            "DOCUMENT_CLIENT_ERROR"
        );
    }
    return driver.documentClient;
};

export const getTable = (context: FileManagerContext): string => {
    const db = context.db as any;
    if (!db) {
        throw new WebinyError("Missing db on context.", "DB_ERROR");
    } else if (!db.table) {
        throw new WebinyError("Missing table on context.db.", "TABLE_ERROR");
    }
    return db.table;
};

export const encodeCursor = (cursor?: string): string | undefined => {
    if (!cursor) {
        return undefined;
    }
    
    return Buffer.from(JSON.stringify(cursor)).toString("base64");
};

export const decodeCursor = (cursor?: string): string | undefined => {
    if (!cursor) {
        return undefined;
    }
    
    return JSON.parse(Buffer.from(cursor, "base64").toString("ascii"));
};
