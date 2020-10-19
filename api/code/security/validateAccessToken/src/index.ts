import { DocumentClient } from "aws-sdk/clients/dynamodb";
import { createHandler } from "@webiny/handler-aws";
import validateAccessToken from "@webiny/api-security-user-management/personalAccessToken/validator";
import dynamoDb from "@webiny/api-plugin-commodo-dynamodb";

export const handler = createHandler(
    dynamoDb({
        tableName: process.env.STORAGE_NAME,
        documentClient: new DocumentClient({
            convertEmptyValues: true,
            region: process.env.AWS_REGION
        })
    }),
    // TODO: We'll revisit this later
    validateAccessToken()
);
