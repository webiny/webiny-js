import { DocumentClient } from "aws-sdk/clients/dynamodb";
import { createHandler } from "@webiny/handler-aws/eventBridge";
import flushPlugins from "@webiny/api-prerendering-service-aws/flush/flush";
import flushAwsPlugins from "@webiny/api-prerendering-service-aws/flush";
import { createPrerenderingServiceStorageOperations } from "@webiny/api-prerendering-service-so-ddb";

const documentClient = new DocumentClient({
    convertEmptyValues: true,
    region: process.env.AWS_REGION
});

export const handler = createHandler({
    plugins: [
        flushPlugins({
            storageOperations: createPrerenderingServiceStorageOperations({
                table: table => ({
                    ...table,
                    name: String(process.env.DB_TABLE)
                }),
                documentClient
            })
        }),
        flushAwsPlugins()
    ]
});
