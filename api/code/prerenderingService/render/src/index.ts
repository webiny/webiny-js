import { DocumentClient } from "aws-sdk/clients/dynamodb";
import { createHandler } from "@webiny/handler-aws";
import dbPlugins from "@webiny/handler-db";
import { DynamoDbDriver } from "@webiny/db-dynamodb";
import renderPlugins from "@webiny/api-prerendering-service/render";
import renderAwsPlugins from "@webiny/api-prerendering-service-aws/render";
import logsPlugins from "@webiny/handler-logs";
import { createPrerenderingServiceStorageOperations } from "@webiny/api-prerendering-service-so-ddb";

const documentClient = new DocumentClient({
    convertEmptyValues: true,
    region: process.env.AWS_REGION
});

export const handler = createHandler(
    logsPlugins(),
    renderPlugins({
        storageOperations: createPrerenderingServiceStorageOperations({
            documentClient
        })
    }),
    renderAwsPlugins(),
    dbPlugins({
        table: process.env.DB_TABLE,
        driver: new DynamoDbDriver({
            documentClient
        })
    })
);
