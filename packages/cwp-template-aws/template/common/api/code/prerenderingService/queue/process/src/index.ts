import { DocumentClient } from "aws-sdk/clients/dynamodb";
import { createHandler } from "@webiny/handler-aws";
import queueProcessPlugins from "@webiny/api-prerendering-service/queue/process";
import { createPrerenderingServiceStorageOperations } from "@webiny/api-prerendering-service-so-ddb";

const documentClient = new DocumentClient({
    convertEmptyValues: true,
    region: process.env.AWS_REGION
});

export const handler = createHandler(
    queueProcessPlugins({
        handlers: {
            render: process.env.PRERENDERING_RENDER_HANDLER,
            flush: process.env.PRERENDERING_FLUSH_HANDLER
        },
        storageOperations: createPrerenderingServiceStorageOperations({
            table(table) {
                return {
                    ...table,
                    name: String(process.env.DB_TABLE)
                };
            },
            documentClient
        })
    })
);
