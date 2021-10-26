import { DocumentClient } from "aws-sdk/clients/dynamodb";
import { createHandler } from "@webiny/handler-aws";
import dbPlugins from "@webiny/handler-db";
import { DynamoDbDriver } from "@webiny/db-dynamodb";
import queueProcessPlugins from "@webiny/api-prerendering-service/queue/process";

export const handler = createHandler(
    queueProcessPlugins({
        handlers: {
            render: process.env.PRERENDERING_RENDER_HANDLER,
            flush: process.env.PRERENDERING_FLUSH_HANDLER
        }
    }),
    dbPlugins({
        table: process.env.DB_TABLE,
        driver: new DynamoDbDriver({
            documentClient: new DocumentClient({
                convertEmptyValues: true,
                region: process.env.AWS_REGION
            })
        })
    })
);
