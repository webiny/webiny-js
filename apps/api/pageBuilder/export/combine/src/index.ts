import { getDocumentClient } from "@webiny/aws-sdk/client-dynamodb";
import { createHandler } from "@webiny/handler-aws/raw";
import i18nPlugins from "@webiny/api-i18n/graphql";
import i18nDynamoDbStorageOperations from "@webiny/api-i18n-ddb";
import i18nContentPlugins from "@webiny/api-i18n-content/plugins";
import { createFormBuilder } from "@webiny/api-form-builder";
import { createFormBuilderStorageOperations } from "@webiny/api-form-builder-so-ddb";
import {
    createPageBuilderContext,
    createPageBuilderGraphQL
} from "@webiny/api-page-builder/graphql";
import { createStorageOperations as createPageBuilderStorageOperations } from "@webiny/api-page-builder-so-ddb";
import pageBuilderImportExportPlugins from "@webiny/api-page-builder-import-export/graphql";
import { createStorageOperations as createPageBuilderImportExportStorageOperations } from "@webiny/api-page-builder-import-export-so-ddb";
import exportCombinePlugins from "@webiny/api-page-builder-import-export/export/combine";
import dbPlugins from "@webiny/handler-db";
import { DynamoDbDriver } from "@webiny/db-dynamodb";
import dynamoDbPlugins from "@webiny/db-dynamodb/plugins";
import logsPlugins from "@webiny/handler-logs";
import securityPlugins from "./security";

const documentClient = getDocumentClient();

const debug = process.env.DEBUG === "true";

export const handler = createHandler({
    plugins: [
        dynamoDbPlugins(),
        logsPlugins(),
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
        createPageBuilderContext({
            storageOperations: createPageBuilderStorageOperations({
                documentClient
            })
        }),
        createPageBuilderGraphQL(),
        createFormBuilder({
            storageOperations: createFormBuilderStorageOperations({
                documentClient
            })
        }),
        pageBuilderImportExportPlugins({
            storageOperations: createPageBuilderImportExportStorageOperations({ documentClient })
        }),
        exportCombinePlugins()
    ],
    debug
});
