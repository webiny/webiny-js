import { DocumentClient } from "aws-sdk/clients/dynamodb";
import { createHandler } from "@webiny/handler-aws";
import dbPlugins from "@webiny/handler-db";
import { DynamoDbDriver } from "@webiny/db-dynamodb";
import updateSettingsPlugins from "@webiny/api-page-builder/updateSettings";
import pageBuilderDynamoDbPlugins from "@webiny/api-page-builder-so-ddb";
import dynamoDbPlugins from "@webiny/db-dynamodb/plugins";

export const handler = createHandler(
    updateSettingsPlugins(),
    dbPlugins({
        table: process.env.DB_TABLE,
        driver: new DynamoDbDriver({
            documentClient: new DocumentClient({
                convertEmptyValues: true,
                region: process.env.AWS_REGION
            })
        })
    }),
    dynamoDbPlugins(),
    pageBuilderDynamoDbPlugins()
);
