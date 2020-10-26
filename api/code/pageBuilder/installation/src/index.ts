import { createHandler } from "@webiny/handler-aws";
import installationPlugins from "@webiny/api-page-builder/handlers/installation";
import { DocumentClient } from "aws-sdk/clients/dynamodb";
import dbPlugins from "@webiny/handler-db";
import { DynamoDbDriver } from "@webiny/db-dynamodb";

export const handler = createHandler(
    dbPlugins({
        table: process.env.DB_TABLE,
        driver: new DynamoDbDriver({
            documentClient: new DocumentClient({
                convertEmptyValues: true,
                region: process.env.AWS_REGION
            })
        })
    }),
    installationPlugins()
);
