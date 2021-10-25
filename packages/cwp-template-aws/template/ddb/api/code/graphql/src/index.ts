import { DocumentClient } from "aws-sdk/clients/dynamodb";
import { createHandler } from "@webiny/handler-aws";
import graphqlPlugins from "@webiny/handler-graphql";
import i18nPlugins from "@webiny/api-i18n/graphql";
import i18nDynamoDbStorageOperations from "@webiny/api-i18n-ddb";
import adminUsersPlugins from "@webiny/api-security-admin-users";
import securityAdminUsersDynamoDbStorageOperations from "@webiny/api-security-admin-users-so-ddb";
import i18nContentPlugins from "@webiny/api-i18n-content/plugins";
import pageBuilderPlugins from "@webiny/api-page-builder/graphql";
import pageBuilderDynamoDbPlugins from "@webiny/api-page-builder-so-ddb";
import pageBuilderPrerenderingPlugins from "@webiny/api-page-builder/prerendering";
import pageBuilderImportExportPlugins from "@webiny/api-page-builder-import-export/graphql";
import { createStorageOperations as createPageImportExportStorageOperations } from "@webiny/api-page-builder-import-export-so-ddb";
import dbPlugins from "@webiny/handler-db";
import { DynamoDbDriver } from "@webiny/db-dynamodb";
import fileManagerPlugins from "@webiny/api-file-manager/plugins";
import fileManagerDynamoDbPlugins from "@webiny/api-file-manager-ddb";
import prerenderingServicePlugins from "@webiny/api-prerendering-service/client";
import logsPlugins from "@webiny/handler-logs";
import fileManagerS3 from "@webiny/api-file-manager-s3";
import { createFormBuilder } from "@webiny/api-form-builder";
import { createFormBuilderStorageOperations } from "@webiny/api-form-builder-so-ddb";
import securityPlugins from "./security";
import headlessCmsPlugins from "@webiny/api-headless-cms/plugins";
import headlessCmsDynamoDbStorageOperation from "@webiny/api-headless-cms-ddb";
import dynamoDbPlugins from "@webiny/db-dynamodb/plugins";

// Imports plugins created via scaffolding utilities.
import scaffoldsPlugins from "./plugins/scaffolds";

const debug = process.env.DEBUG === "true";

const documentClient = new DocumentClient({
    convertEmptyValues: true,
    region: process.env.AWS_REGION
});

export const handler = createHandler({
    plugins: [
        dynamoDbPlugins(),
        logsPlugins(),
        graphqlPlugins({ debug }),
        dbPlugins({
            table: process.env.DB_TABLE,
            driver: new DynamoDbDriver({
                documentClient
            })
        }),
        securityPlugins(),
        i18nPlugins(),
        i18nDynamoDbStorageOperations(),
        i18nContentPlugins(),
        fileManagerPlugins(),
        fileManagerDynamoDbPlugins(),
        // Add File storage S3 plugin for API file manager.
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
        adminUsersPlugins(),
        securityAdminUsersDynamoDbStorageOperations(),
        pageBuilderPlugins(),
        pageBuilderDynamoDbPlugins(),
        pageBuilderPrerenderingPlugins(),
        pageBuilderImportExportPlugins({
            storageOperations: createPageImportExportStorageOperations({ documentClient })
        }),
        createFormBuilder({
            storageOperations: createFormBuilderStorageOperations({
                documentClient
            })
        }),
        headlessCmsPlugins(),
        headlessCmsDynamoDbStorageOperation(),
        scaffoldsPlugins()
    ],
    http: { debug }
});
