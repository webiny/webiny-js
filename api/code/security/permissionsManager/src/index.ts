import { DocumentClient } from "aws-sdk/clients/dynamodb";
import { createHandler } from "@webiny/handler-aws";
import permissionsManagerPlugins from "@webiny/api-security-permissions-manager/handler";
import userManagerPlugins from "@webiny/api-security-user-management/permissionsManager";
import dynamoDb from "@webiny/api-plugin-commodo-dynamodb";

export const handler = createHandler(
    dynamoDb({
        tableName: process.env.STORAGE_NAME,
        documentClient: new DocumentClient({
            convertEmptyValues: true,
            region: process.env.AWS_REGION
        })
    }),
    permissionsManagerPlugins({ cache: false }),
    userManagerPlugins()
);
