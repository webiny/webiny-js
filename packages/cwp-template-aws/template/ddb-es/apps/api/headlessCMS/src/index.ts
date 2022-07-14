import { DocumentClient } from "aws-sdk/clients/dynamodb";
import { createHandler } from "@webiny/handler-aws";
import { createWcpContext } from "@webiny/api-wcp";
import i18nPlugins from "@webiny/api-i18n/graphql";
import i18nDynamoDbStorageOperations from "@webiny/api-i18n-ddb";
import dbPlugins from "@webiny/handler-db";
import { DynamoDbDriver } from "@webiny/db-dynamodb";
import securityPlugins from "./security";
import { createHeadlessCmsGraphQL, createHeadlessCmsContext } from "@webiny/api-headless-cms";
import { createStorageOperations as createHeadlessCmsStorageOperations } from "@webiny/api-headless-cms-ddb-es";
import logsPlugins from "@webiny/handler-logs";
import elasticsearchDataGzipCompression from "@webiny/api-elasticsearch/plugins/GzipCompression";
import { createElasticsearchClient } from "@webiny/api-elasticsearch/client";
/**
 * APW
 */
import { createApwHeadlessCmsContext } from "@webiny/api-apw";
import { createStorageOperations as createApwSaStorageOperations } from "@webiny/api-apw-scheduler-so-ddb";

// Imports plugins created via scaffolding utilities.
import scaffoldsPlugins from "./plugins/scaffolds";

const debug = process.env.DEBUG === "true";

const documentClient = new DocumentClient({
    convertEmptyValues: true,
    region: process.env.AWS_REGION
});

const elasticsearch = createElasticsearchClient({
    endpoint: `https://${process.env.ELASTIC_SEARCH_ENDPOINT}`
});

export const handler = createHandler({
    plugins: [
        createWcpContext(),
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
                documentClient,
                elasticsearch,
                plugins: [elasticsearchDataGzipCompression()]
            })
        }),
        createHeadlessCmsGraphQL({ debug }),
        createApwHeadlessCmsContext({
            storageOperations: createApwSaStorageOperations({ documentClient })
        }),
        scaffoldsPlugins()
    ],
    http: { debug }
});
