import updateSettingsPlugins from "@webiny/api-page-builder/updateSettings";
import { DocumentClient } from "aws-sdk/clients/dynamodb";
import { createHandler } from "@webiny/handler-aws";
import { createStorageOperations as createPageBuilderStorageOperations } from "@webiny/api-page-builder-so-ddb";

const documentClient = new DocumentClient({
    convertEmptyValues: true,
    region: process.env.AWS_REGION
});

export const handler = createHandler(
    updateSettingsPlugins({
        storageOperations: createPageBuilderStorageOperations({
            documentClient
        })
    })
);
