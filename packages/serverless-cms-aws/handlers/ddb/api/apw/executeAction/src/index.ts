import { createHandler } from "@webiny/handler-aws";
import { executeActionHandlerPlugins } from "@webiny/api-apw/scheduler/handlers/executeAction";
import { createStorageOperations } from "@webiny/api-apw-scheduler-so-ddb";
import { DocumentClient } from "aws-sdk/clients/dynamodb";

const documentClient = new DocumentClient({
    convertEmptyValues: true,
    region: process.env.AWS_REGION
});

const debug = process.env.DEBUG === "true";

export const handler = createHandler({
    plugins: executeActionHandlerPlugins({
        storageOperations: createStorageOperations({
            documentClient
        })
    }),
    http: { debug }
});
