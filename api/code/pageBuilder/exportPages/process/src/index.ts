import { DocumentClient } from "aws-sdk/clients/dynamodb";
import { createHandler } from "@webiny/handler-aws";
import i18nPlugins from "@webiny/api-i18n/graphql";
import i18nDynamoDbStorageOperations from "@webiny/api-i18n-ddb";
import i18nContentPlugins from "@webiny/api-i18n-content/plugins";
import pageBuilderPlugins from "@webiny/api-page-builder/graphql";
import pageBuilderDynamoDbElasticsearchPlugins from "@webiny/api-page-builder-so-ddb-es";
import pageBuilderImportExportPlugins from "@webiny/api-page-builder-import-export/graphql";
import { createStorageOperations as createPageBuilderStorageOperations } from "@webiny/api-page-builder-import-export-so-ddb";
import exportPagesProcessPlugins from "@webiny/api-page-builder-import-export/exportPages/process";
import dbPlugins from "@webiny/handler-db";
import { DynamoDbDriver } from "@webiny/db-dynamodb";
import dynamoDbPlugins from "@webiny/db-dynamodb/plugins";
import elasticSearch from "@webiny/api-elasticsearch";
import logsPlugins from "@webiny/handler-logs";
import securityPlugins from "./security";

const documentClient = new DocumentClient({
    convertEmptyValues: true,
    region: process.env.AWS_REGION
});

const debug = process.env.DEBUG === "true";

export const handler = createHandler({
    plugins: [
        dynamoDbPlugins(),
        logsPlugins(),
        elasticSearch({ endpoint: `https://${process.env.ELASTIC_SEARCH_ENDPOINT}` }),
        dbPlugins({
            table: process.env.DB_TABLE,
            driver: new DynamoDbDriver({
                documentClient
            })
        }),
        securityPlugins({ documentClient }),
        i18nPlugins(),
        i18nDynamoDbStorageOperations(),
        i18nContentPlugins(),
        pageBuilderPlugins(),
        pageBuilderDynamoDbElasticsearchPlugins(),
        pageBuilderImportExportPlugins({
            storageOperations: createPageBuilderStorageOperations({ documentClient })
        }),
        exportPagesProcessPlugins({
            handlers: {
                process: process.env.AWS_LAMBDA_FUNCTION_NAME,
                combine: process.env.EXPORT_PAGE_COMBINE_HANDLER
            }
        })
    ],
    http: { debug }
});
