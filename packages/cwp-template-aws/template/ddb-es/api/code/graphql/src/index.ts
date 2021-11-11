import { DocumentClient } from "aws-sdk/clients/dynamodb";
import { createHandler } from "@webiny/handler-aws";
import graphqlPlugins from "@webiny/handler-graphql";
import i18nPlugins from "@webiny/api-i18n/graphql";
import i18nDynamoDbStorageOperations from "@webiny/api-i18n-ddb";
import i18nContentPlugins from "@webiny/api-i18n-content/plugins";
import pageBuilderPlugins from "@webiny/api-page-builder/graphql";
import pageBuilderDynamoDbElasticsearchPlugins from "@webiny/api-page-builder-so-ddb-es";
import pageBuilderPrerenderingPlugins from "@webiny/api-page-builder/prerendering";
import pageBuilderImportExportPlugins from "@webiny/api-page-builder-import-export/graphql";
import { createStorageOperations as createPageImportExportStorageOperations } from "@webiny/api-page-builder-import-export-so-ddb";
import prerenderingServicePlugins from "@webiny/api-prerendering-service/client";
import dbPlugins from "@webiny/handler-db";
import { DynamoDbDriver } from "@webiny/db-dynamodb";
import dynamoDbPlugins from "@webiny/db-dynamodb/plugins";
import elasticsearchClientContext from "@webiny/api-elasticsearch";
import fileManagerPlugins from "@webiny/api-file-manager/plugins";
import fileManagerDynamoDbElasticStorageOperation from "@webiny/api-file-manager-ddb-es";
import logsPlugins from "@webiny/handler-logs";
import fileManagerS3 from "@webiny/api-file-manager-s3";
import { createFormBuilder } from "@webiny/api-form-builder";
import { createFormBuilderStorageOperations } from "@webiny/api-form-builder-so-ddb-es";
import { createAdminHeadlessCms } from "@webiny/api-headless-cms/plugins";
import { createStorageOperations as createHeadlessCmsStorageOperations } from "@webiny/api-headless-cms-ddb-es";
import headlessCmsModelFieldToGraphQLPlugins from "@webiny/api-headless-cms/content/plugins/graphqlFields";
import elasticsearchDataGzipCompression from "@webiny/api-elasticsearch/plugins/GzipCompression";
import securityPlugins from "./security";

// Imports plugins created via scaffolding utilities.
import scaffoldsPlugins from "./plugins/scaffolds";
import { createElasticsearchClient } from "@webiny/api-elasticsearch/client";

const debug = process.env.DEBUG === "true";

const documentClient = new DocumentClient({
    convertEmptyValues: true,
    region: process.env.AWS_REGION
});

const elasticsearchClient = createElasticsearchClient({
    endpoint: `https://${process.env.ELASTIC_SEARCH_ENDPOINT}`
});

export const handler = createHandler({
    plugins: [
        dynamoDbPlugins(),
        logsPlugins(),
        graphqlPlugins({ debug }),
        elasticsearchClientContext(elasticsearchClient),
        dbPlugins({
            table: process.env.DB_TABLE,
            driver: new DynamoDbDriver({ documentClient })
        }),
        securityPlugins({ documentClient }),
        i18nPlugins(),
        i18nDynamoDbStorageOperations(),
        i18nContentPlugins(),
        fileManagerPlugins(),
        fileManagerDynamoDbElasticStorageOperation(),
        fileManagerS3(),
        prerenderingServicePlugins({
            handlers: {
                render: process.env.PRERENDERING_RENDER_HANDLER,
                flush: process.env.PRERENDERING_FLUSH_HANDLER,
                queue: {
                    add: process.env.PRERENDERING_QUEUE_ADD_HANDLER,
                    process: process.env.PRERENDERING_QUEUE_PROCESS_HANDLER
                }
            }
        }),
        pageBuilderPlugins(),
        pageBuilderDynamoDbElasticsearchPlugins(),
        pageBuilderPrerenderingPlugins(),
        pageBuilderImportExportPlugins({
            storageOperations: createPageImportExportStorageOperations({ documentClient })
        }),
        createFormBuilder({
            storageOperations: createFormBuilderStorageOperations({
                documentClient,
                elasticsearch: elasticsearchClient
            })
        }),
        createAdminHeadlessCms({
            setupGraphQL: true,
            storageOperations: createHeadlessCmsStorageOperations({
                documentClient,
                elasticsearch: elasticsearchClient,
                modelFieldToGraphQLPlugins: headlessCmsModelFieldToGraphQLPlugins(),
                plugins: [elasticsearchDataGzipCompression()]
            })
        }),
        scaffoldsPlugins(),
        elasticsearchDataGzipCompression()
    ],
    http: { debug }
});
