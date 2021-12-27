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
            render: process.env.PRERENDERING_RENDER_HANDLER as string,
            flush: process.env.PRERENDERING_FLUSH_HANDLER as string
        },
        storageOperations: createPrerenderingServiceStorageOperations({
            table(table) {
                return {
                    ...table,
                    name: process.env.DB_TABLE as string
                };
            },
            documentClient
        })
    })
);
