import { DocumentClient } from "aws-sdk/clients/dynamodb";
import { createHandler } from "@webiny/handler-aws";
import queueProcessPlugins from "@webiny/api-prerendering-service/queue/process";
import logsPlugins from "@webiny/handler-logs";
import { createPrerenderingServiceStorageOperations } from "@webiny/api-prerendering-service-so-ddb";

const documentClient = new DocumentClient({
    convertEmptyValues: true,
    region: process.env.AWS_REGION
});
export const handler = createHandler({
    plugins: [
        logsPlugins(),
        queueProcessPlugins({
            handlers: {
                render: process.env.PRERENDERING_RENDER_HANDLER,
                flush: process.env.PRERENDERING_FLUSH_HANDLER
            },
            storageOperations: createPrerenderingServiceStorageOperations({
                documentClient,
                table: table => ({ ...table, name: process.env.DB_TABLE })
            })
        })
    ],
    http: { debug: process.env.DEBUG === "true" }
});
