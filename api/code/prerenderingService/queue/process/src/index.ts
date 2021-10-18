import { DocumentClient } from "aws-sdk/clients/dynamodb";
import { createHandler } from "@webiny/handler-aws";
import dbPlugins from "@webiny/handler-db";
import { DynamoDbDriver } from "@webiny/db-dynamodb";
import queueProcessPlugins from "@webiny/api-prerendering-service/queue/process";
import logsPlugins from "@webiny/handler-logs";
import { createPrerenderingServiceStorageOperations } from "@webiny/api-prerendering-service-so-ddb";

const documentClient = new DocumentClient({
    convertEmptyValues: true,
    region: process.env.AWS_REGION
});

export const handler = createHandler(
    logsPlugins(),
    queueProcessPlugins({
        handlers: {
            render: process.env.PRERENDERING_RENDER_HANDLER,
            flush: process.env.PRERENDERING_FLUSH_HANDLER
        },
        storageOperations: createPrerenderingServiceStorageOperations({
            documentClient
        })
    }),
    dbPlugins({
        table: process.env.DB_TABLE,
        driver: new DynamoDbDriver({
            documentClient
        })
    })
);
