import { createHandler } from "@webiny/handler-aws/raw";
import { executeActionHandlerPlugins } from "@webiny/api-apw/scheduler/handlers/executeAction";
import { createStorageOperations } from "@webiny/api-apw-scheduler-so-ddb";
import { getDocumentClient } from "@webiny/aws-sdk/client-dynamodb";

const documentClient = getDocumentClient();

const debug = process.env.DEBUG === "true";

export const handler = createHandler({
    plugins: executeActionHandlerPlugins({
        storageOperations: createStorageOperations({
            documentClient
        })
    }),
    debug
});
