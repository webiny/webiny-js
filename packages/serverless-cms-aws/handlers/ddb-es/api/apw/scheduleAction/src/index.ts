import { CloudWatchEventsClient } from "@webiny/aws-sdk/client-cloudwatch";
import { createHandler } from "@webiny/handler-aws/raw";
import { scheduleActionHandlerPlugins } from "@webiny/api-apw/scheduler/handlers/scheduleAction";
import { createStorageOperations } from "@webiny/api-apw-scheduler-so-ddb";
import { getDocumentClient } from "@webiny/aws-sdk/client-dynamodb";

const documentClient = getDocumentClient();

const debug = process.env.DEBUG === "true";

export const handler = createHandler({
    plugins: scheduleActionHandlerPlugins({
        cwClient: new CloudWatchEventsClient({ region: process.env.AWS_REGION }),
        storageOperations: createStorageOperations({
            documentClient
        }),
        handlers: {
            executeAction: String(process.env.APW_SCHEDULER_EXECUTE_ACTION_HANDLER)
        }
    }),
    debug
});
