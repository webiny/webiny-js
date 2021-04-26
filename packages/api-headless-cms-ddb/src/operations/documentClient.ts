import {CmsContext} from "@webiny/api-headless-cms/types";
import { DocumentClient } from "aws-sdk/clients/dynamodb";
import WebinyError from "@webiny/error";


export const getDocumentClient = (context: CmsContext): DocumentClient => {
    const driver = context.db.driver as any;
    if (!driver || !driver.documentClient) {
        throw new WebinyError(
            `Missing documentDriver on the context db.driver property.`,
            "DOCUMENT_CLIENT_ERROR",
        );
    }
    return driver.documentClient;
};