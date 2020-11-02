import { DocumentClient } from "aws-sdk/clients/dynamodb";
import { createHandler } from "@webiny/handler-aws";
import permissionsManagerPlugins from "@webiny/api-security-permissions-manager/handler";
import userManagerPlugins from "@webiny/api-security-user-management/permissionsManager";
import dbPlugins from "@webiny/handler-db";
import { DynamoDbDriver } from "@webiny/db-dynamodb/index";

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
    permissionsManagerPlugins({ cache: false }),
    userManagerPlugins()
);
