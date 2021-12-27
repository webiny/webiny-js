import { DocumentClient } from "aws-sdk/clients/dynamodb";
import { createHandler } from "@webiny/handler-aws";
import flushPlugins from "@webiny/api-prerendering-service/flush";
import flushAwsPlugins from "@webiny/api-prerendering-service-aws/flush";
import { createPrerenderingServiceStorageOperations } from "@webiny/api-prerendering-service-so-ddb";

const documentClient = new DocumentClient({
    convertEmptyValues: true,
    region: process.env.AWS_REGION
});

export const handler = createHandler(
    flushPlugins({
        storageOperations: createPrerenderingServiceStorageOperations({
            table(table) {
                return {
                    ...table,
                    name: String(process.env.DB_TABLE)
                };
            },
            documentClient
        })
    }),
    flushAwsPlugins()
);
