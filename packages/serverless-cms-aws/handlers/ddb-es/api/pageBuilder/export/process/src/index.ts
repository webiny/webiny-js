import { DocumentClient } from "aws-sdk/clients/dynamodb";
import { createHandler } from "@webiny/handler-aws/raw";
import i18nPlugins from "@webiny/api-i18n/graphql";
import i18nDynamoDbStorageOperations from "@webiny/api-i18n-ddb";
import { createFormBuilder } from "@webiny/api-form-builder";
import { createFormBuilderStorageOperations } from "@webiny/api-form-builder-so-ddb-es";
import { createPageBuilderContext } from "@webiny/api-page-builder/graphql";
import { createStorageOperations as createPageBuilderStorageOperations } from "@webiny/api-page-builder-so-ddb-es";
import pageBuilderImportExportPlugins from "@webiny/api-page-builder-import-export/graphql";
import { createStorageOperations as createPageBuilderImportExportStorageOperations } from "@webiny/api-page-builder-import-export-so-ddb";
import exportProcessPlugins from "@webiny/api-page-builder-import-export/export/process";
import dbPlugins from "@webiny/handler-db";
import { DynamoDbDriver } from "@webiny/db-dynamodb";
import dynamoDbPlugins from "@webiny/db-dynamodb/plugins";
import elasticSearch, {
    createElasticsearchClient,
    createGzipCompression
} from "@webiny/api-elasticsearch";
import { CmsParametersPlugin, createHeadlessCmsContext } from "@webiny/api-headless-cms";
import { createStorageOperations as createHeadlessCmsStorageOperations } from "@webiny/api-headless-cms-ddb-es";
import { createFileManagerContext } from "@webiny/api-file-manager";
import { createFileManagerStorageOperations } from "@webiny/api-file-manager-ddb";
import logsPlugins from "@webiny/handler-logs";
import fileManagerS3 from "@webiny/api-file-manager-s3";
import securityPlugins from "./security";

const documentClient = new DocumentClient({
    convertEmptyValues: true,
    region: process.env.AWS_REGION
});

const elasticsearchClient = createElasticsearchClient({
    endpoint: `https://${process.env.ELASTIC_SEARCH_ENDPOINT}`
});

const debug = process.env.DEBUG === "true";

export const handler = createHandler({
    plugins: [
        dynamoDbPlugins(),
        logsPlugins(),
        createGzipCompression(),
        elasticSearch(elasticsearchClient),
        dbPlugins({
            table: process.env.DB_TABLE,
            driver: new DynamoDbDriver({ documentClient })
        }),
        securityPlugins({ documentClient }),
        i18nPlugins(),
        i18nDynamoDbStorageOperations(),
        new CmsParametersPlugin(async context => {
            const locale = context.i18n.getCurrentLocale("content")?.code || "en-US";
            return {
                type: "manage",
                locale
            };
        }),
        createHeadlessCmsContext({
            storageOperations: createHeadlessCmsStorageOperations({
                documentClient,
                elasticsearch: elasticsearchClient
            })
        }),
        createFileManagerContext({
            storageOperations: createFileManagerStorageOperations({
                documentClient
            })
        }),
        fileManagerS3(),
        createPageBuilderContext({
            storageOperations: createPageBuilderStorageOperations({
                documentClient,
                elasticsearch: elasticsearchClient
            })
        }),
        createFormBuilder({
            storageOperations: createFormBuilderStorageOperations({
                documentClient,
                elasticsearch: elasticsearchClient
            })
        }),
        pageBuilderImportExportPlugins({
            storageOperations: createPageBuilderImportExportStorageOperations({ documentClient })
        }),
        exportProcessPlugins({
            handlers: {
                process: process.env.AWS_LAMBDA_FUNCTION_NAME,
                combine: process.env.EXPORT_COMBINE_HANDLER
            }
        })
    ],
    http: { debug }
});
