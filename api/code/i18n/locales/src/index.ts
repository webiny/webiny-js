import { createHandler } from "@webiny/handler-aws";
import locales from "@webiny/api-i18n/handlers/locales";
import { DocumentClient } from "aws-sdk/clients/dynamodb";
import dbPlugins from "@webiny/handler-db";
import { DynamoDbDriver } from "@webiny/db-dynamodb";

export const handler = createHandler(
    dbPlugins(
        new DynamoDbDriver({
            table: process.env.DB_TABLE,
            documentClient: new DocumentClient({
                convertEmptyValues: true,
                region: process.env.AWS_REGION
            })
        })
    ),
    locales()
);
