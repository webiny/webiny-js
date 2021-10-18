import { DocumentClient } from "aws-sdk/clients/dynamodb";
import { createHandler } from "@webiny/handler-aws";
import dbPlugins from "@webiny/handler-db";
import { DynamoDbDriver } from "@webiny/db-dynamodb";
import flushPlugins from "@webiny/api-prerendering-service/flush";
import flushAwsPlugins from "@webiny/api-prerendering-service-aws/flush";
import logsPlugins from "@webiny/handler-logs";
import { createPrerenderingServiceStorageOperations } from "@webiny/api-prerendering-service-so-ddb";

const documentClient = new DocumentClient({
    convertEmptyValues: true,
    region: process.env.AWS_REGION
});

export const handler = createHandler(
    logsPlugins(),
    flushPlugins({
        storageOperations: createPrerenderingServiceStorageOperations({
            documentClient
        })
    }),
    flushAwsPlugins(),
    dbPlugins({
        table: process.env.DB_TABLE,
        driver: new DynamoDbDriver({
            documentClient
        })
    })
);
