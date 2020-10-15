import { createHandler } from "@webiny/handler-aws";
import locales from "@webiny/api-i18n/locales";
import { DocumentClient } from "aws-sdk/clients/dynamodb";
import dynamoDb from "@webiny/api-plugin-commodo-dynamodb";

export const handler = createHandler(
    dynamoDb({
        tableName: process.env.STORAGE_NAME,
        documentClient: new DocumentClient({
            convertEmptyValues: true,
            region: process.env.AWS_REGION
        })
    }),
    locales()
);
