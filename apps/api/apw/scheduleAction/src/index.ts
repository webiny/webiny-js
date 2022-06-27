const { CloudWatchEventsClient } = require("@aws-sdk/client-cloudwatch-events");
import { createHandler } from "@webiny/handler-aws";
import { scheduleActionHandlerPlugins } from "@webiny/api-apw/scheduler/handlers/scheduleAction";
import { createStorageOperations } from "@webiny/api-apw-scheduler-so-ddb";
import { DocumentClient } from "aws-sdk/clients/dynamodb";

const documentClient = new DocumentClient({
    convertEmptyValues: true,
    region: process.env.AWS_REGION
});

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
    http: { debug }
});
