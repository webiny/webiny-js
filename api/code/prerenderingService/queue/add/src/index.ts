import { DocumentClient } from "aws-sdk/clients/dynamodb";
import { createHandler } from "@webiny/handler-aws";
import queueAddPlugins from "@webiny/api-prerendering-service/queue/add";
import logsPlugins from "@webiny/handler-logs";
import { createPrerenderingServiceStorageOperations } from "@webiny/api-prerendering-service-so-ddb";

const documentClient = new DocumentClient({
    convertEmptyValues: true,
    region: process.env.AWS_REGION
});
export const handler = createHandler({
    plugins: [
        logsPlugins(),
        queueAddPlugins({
            storageOperations: createPrerenderingServiceStorageOperations({
                documentClient,
                table: table => ({ ...table, name: process.env.DB_TABLE })
            })
        })
    ],
    http: { debug: process.env.DEBUG === "true" }
});
