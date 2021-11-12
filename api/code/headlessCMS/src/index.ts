import { DocumentClient } from "aws-sdk/clients/dynamodb";
import { createHandler } from "@webiny/handler-aws";
import i18nPlugins from "@webiny/api-i18n/graphql";
import i18nDynamoDbStorageOperations from "@webiny/api-i18n-ddb";
import i18nContentPlugins from "@webiny/api-i18n-content/plugins";
import dbPlugins from "@webiny/handler-db";
import { DynamoDbDriver } from "@webiny/db-dynamodb";
import dynamoDbPlugins from "@webiny/db-dynamodb/plugins";
import securityPlugins from "./security";
import logsPlugins from "@webiny/handler-logs";
import {
    createContentHeadlessCmsContext,
    createContentHeadlessCmsGraphQL
} from "@webiny/api-headless-cms";
import { createStorageOperations as createHeadlessCmsStorageOperations } from "@webiny/api-headless-cms-ddb-es";
import headlessCmsModelFieldToGraphQLPlugins from "@webiny/api-headless-cms/content/plugins/graphqlFields";
import elasticsearchDataGzipCompression from "@webiny/api-elasticsearch/plugins/GzipCompression";

// Imports plugins created via scaffolding utilities.
import scaffoldsPlugins from "./plugins/scaffolds";
import { createElasticsearchClient } from "@webiny/api-elasticsearch/client";

const debug = process.env.DEBUG === "true";
const elasticsearchClient = createElasticsearchClient({
    endpoint: `https://${process.env.ELASTIC_SEARCH_ENDPOINT}`
});
const documentClient = new DocumentClient({
    convertEmptyValues: true,
    region: process.env.AWS_REGION
});

export const handler = createHandler({
    plugins: [
        logsPlugins(),
        dynamoDbPlugins(),
        dbPlugins({
            table: process.env.DB_TABLE,
            driver: new DynamoDbDriver({ documentClient })
        }),
        securityPlugins({ documentClient }),
        i18nPlugins(),
        i18nDynamoDbStorageOperations(),
        i18nContentPlugins(),
        scaffoldsPlugins(),
        createContentHeadlessCmsContext({
            storageOperations: createHeadlessCmsStorageOperations({
                documentClient,
                elasticsearch: elasticsearchClient,
                modelFieldToGraphQLPlugins: headlessCmsModelFieldToGraphQLPlugins(),
                plugins: [elasticsearchDataGzipCompression()]
            })
        }),
        createContentHeadlessCmsGraphQL({ debug })
    ],
    http: { debug }
});
