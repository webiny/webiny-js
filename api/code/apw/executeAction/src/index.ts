import { createHandler } from "@webiny/handler-aws";
import executeActionHandlerPlugins from "@webiny/api-apw/scheduler/handlers/executeAction";
import { createStorageOperations } from "@webiny/api-apw-scheduler-so-ddb";
import { DocumentClient } from "aws-sdk/clients/dynamodb";
import dbPlugins from "@webiny/handler-db";
import { DynamoDbDriver } from "@webiny/db-dynamodb";
import dynamoDbPlugins from "@webiny/db-dynamodb/plugins";
import logsPlugins from "@webiny/handler-logs";

const documentClient = new DocumentClient({
    convertEmptyValues: true,
    region: process.env.AWS_REGION
});

const debug = process.env.DEBUG === "true";

export const handler = createHandler({
    plugins: [
        dynamoDbPlugins(),
        logsPlugins(),
        dbPlugins({
            table: process.env.DB_TABLE,
            driver: new DynamoDbDriver({
                documentClient
            })
        }),
        executeActionHandlerPlugins({
            storageOperations: createStorageOperations({
                documentClient
            })
        })
    ],
    http: { debug }
});
