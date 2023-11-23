import { getDocumentClient } from "@webiny/aws-sdk/client-dynamodb";
import { createHandler } from "@webiny/handler-aws/raw";
import i18nPlugins from "@webiny/api-i18n/graphql";
import i18nDynamoDbStorageOperations from "@webiny/api-i18n-ddb";
import i18nContentPlugins from "@webiny/api-i18n-content/plugins";
import { createFormBuilder } from "@webiny/api-form-builder";
import { createFormBuilderStorageOperations } from "@webiny/api-form-builder-so-ddb";
import { createPageBuilderContext } from "@webiny/api-page-builder/graphql";
import { createStorageOperations as createPageBuilderStorageOperations } from "@webiny/api-page-builder-so-ddb";
import pageBuilderImportExportPlugins from "@webiny/api-page-builder-import-export/graphql";
import { createStorageOperations as createPageBuilderImportExportStorageOperations } from "@webiny/api-page-builder-import-export-so-ddb";
import importProcessPlugins from "@webiny/api-page-builder-import-export/import/process";
import dbPlugins from "@webiny/handler-db";
import { DynamoDbDriver } from "@webiny/db-dynamodb";
import dynamoDbPlugins from "@webiny/db-dynamodb/plugins";
import { CmsParametersPlugin, createHeadlessCmsContext } from "@webiny/api-headless-cms";
import { createStorageOperations as createHeadlessCmsStorageOperations } from "@webiny/api-headless-cms-ddb";
import { createFileManagerContext } from "@webiny/api-file-manager";
import { createFileManagerStorageOperations } from "@webiny/api-file-manager-ddb";
import logsPlugins from "@webiny/handler-logs";
import fileManagerS3 from "@webiny/api-file-manager-s3";
import securityPlugins from "./security";
import { createAco } from "@webiny/api-aco";
import { createAcoPageBuilderImportExportContext } from "@webiny/api-page-builder-aco";

const documentClient = getDocumentClient();

const debug = process.env.DEBUG === "true";

export const handler = createHandler({
    plugins: [
        dynamoDbPlugins(),
        logsPlugins(),
        dbPlugins({
            table: process.env.DB_TABLE,
            driver: new DynamoDbDriver({ documentClient })
        }),
        securityPlugins({ documentClient }),
        i18nPlugins(),
        i18nDynamoDbStorageOperations(),
        i18nContentPlugins(),
        new CmsParametersPlugin(async context => {
            const locale = context.i18n.getCurrentLocale("content")?.code || "en-US";
            return {
                type: "manage",
                locale
            };
        }),
        createHeadlessCmsContext({
            storageOperations: createHeadlessCmsStorageOperations({
                documentClient
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
                documentClient
            })
        }),
        createFormBuilder({
            storageOperations: createFormBuilderStorageOperations({
                documentClient
            })
        }),
        pageBuilderImportExportPlugins({
            storageOperations: createPageBuilderImportExportStorageOperations({ documentClient })
        }),
        importProcessPlugins({
            handlers: {
                process: String(process.env.AWS_LAMBDA_FUNCTION_NAME)
            }
        }),
        createAco({ useFolderLevelPermissions: false }),
        createAcoPageBuilderImportExportContext()
    ],
    debug
});
