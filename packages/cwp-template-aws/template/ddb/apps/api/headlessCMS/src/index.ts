import { DocumentClient } from "aws-sdk/clients/dynamodb";
import { createHandler } from "@webiny/handler-aws/gateway";
import { createWcpContext } from "@webiny/api-wcp";
import i18nPlugins from "@webiny/api-i18n/graphql";
import i18nDynamoDbStorageOperations from "@webiny/api-i18n-ddb";
import dbPlugins from "@webiny/handler-db";
import { DynamoDbDriver } from "@webiny/db-dynamodb";
import dynamoDbPlugins from "@webiny/db-dynamodb/plugins";
import securityPlugins from "./security";
import { createHeadlessCmsGraphQL, createHeadlessCmsContext } from "@webiny/api-headless-cms";
import { createStorageOperations as createHeadlessCmsStorageOperations } from "@webiny/api-headless-cms-ddb";
import logsPlugins from "@webiny/handler-logs";
/**
 * APW
 */
import { createApwHeadlessCmsContext, createApwGraphQL } from "@webiny/api-apw";
import { createStorageOperations as createApwSaStorageOperations } from "@webiny/api-apw-scheduler-so-ddb";

// Imports plugins created via scaffolding utilities.
import scaffoldsPlugins from "./plugins/scaffolds";

const debug = process.env.DEBUG === "true";

const documentClient = new DocumentClient({
    convertEmptyValues: true,
    region: process.env.AWS_REGION
});

export const handler = createHandler({
    plugins: [
        createWcpContext(),
        dynamoDbPlugins(),
        logsPlugins(),
        dbPlugins({
            table: process.env.DB_TABLE,
            driver: new DynamoDbDriver({ documentClient })
        }),
        securityPlugins({ documentClient }),
        i18nPlugins(),
        i18nDynamoDbStorageOperations(),
        createHeadlessCmsContext({
            storageOperations: createHeadlessCmsStorageOperations({
                documentClient
            })
        }),
        createHeadlessCmsGraphQL({ debug }),
        createApwGraphQL(),
        createApwHeadlessCmsContext({
            storageOperations: createApwSaStorageOperations({ documentClient })
        }),
        scaffoldsPlugins()
    ],
    http: { debug }
});
