import { DocumentClient } from "aws-sdk/clients/dynamodb";
import { createApiGatewayHandler as createHandler } from "@webiny/handler-aws";
import graphqlPlugins from "@webiny/handler-graphql";
import { createWcpContext, createWcpGraphQL } from "@webiny/api-wcp";
import i18nPlugins from "@webiny/api-i18n/graphql";
import i18nDynamoDbStorageOperations from "@webiny/api-i18n-ddb";
import {
    createPageBuilderContext,
    createPageBuilderGraphQL
} from "@webiny/api-page-builder/graphql";
import { createStorageOperations as createPageBuilderStorageOperations } from "@webiny/api-page-builder-so-ddb";
import pageBuilderPrerenderingPlugins from "@webiny/api-page-builder/prerendering";
import pageBuilderImportExportPlugins from "@webiny/api-page-builder-import-export/graphql";
import { createStorageOperations as createPageBuilderImportExportStorageOperations } from "@webiny/api-page-builder-import-export-so-ddb";
import prerenderingServicePlugins from "@webiny/api-prerendering-service-aws/client";
import dbPlugins from "@webiny/handler-db";
import { DynamoDbDriver } from "@webiny/db-dynamodb";
import dynamoDbPlugins from "@webiny/db-dynamodb/plugins";
import {
    createFileManagerContext,
    createFileManagerGraphQL,
    createFileModelModifier
} from "@webiny/api-file-manager";
import { createFileManagerStorageOperations } from "@webiny/api-file-manager-ddb";
import logsPlugins from "@webiny/handler-logs";
import fileManagerS3 from "@webiny/api-file-manager-s3";
import { createFormBuilder } from "@webiny/api-form-builder";
import { createFormBuilderStorageOperations } from "@webiny/api-form-builder-so-ddb";
import { createHeadlessCmsContext, createHeadlessCmsGraphQL } from "@webiny/api-headless-cms";
import { createStorageOperations as createHeadlessCmsStorageOperations } from "@webiny/api-headless-cms-ddb";
import securityPlugins from "./security";
import tenantManager from "@webiny/api-tenant-manager";
import { createApwGraphQL, createApwPageBuilderContext } from "@webiny/api-apw";
import { createStorageOperations as createApwSaStorageOperations } from "@webiny/api-apw-scheduler-so-ddb";
import { createAco } from "@webiny/api-aco";
import { createAcoPageBuilderContext } from "@webiny/api-page-builder-aco";
import { createAuditLogs } from "@webiny/api-audit-logs";

// Imports plugins created via scaffolding utilities.
import scaffoldsPlugins from "./plugins/scaffolds";
import { createBenchmarkEnablePlugin } from "~/plugins/benchmarkEnable";

const debug = process.env.DEBUG === "true";
const documentClient = new DocumentClient({
    convertEmptyValues: true,
    region: process.env.AWS_REGION
});

export const handler = createHandler({
    plugins: [
        createBenchmarkEnablePlugin(),
        createWcpContext(),
        createWcpGraphQL(),
        dynamoDbPlugins(),
        logsPlugins(),
        graphqlPlugins({ debug }),
        dbPlugins({
            table: process.env.DB_TABLE,
            driver: new DynamoDbDriver({ documentClient })
        }),
        securityPlugins({ documentClient }),
        tenantManager(),
        i18nPlugins(),
        i18nDynamoDbStorageOperations(),
        createHeadlessCmsContext({
            storageOperations: createHeadlessCmsStorageOperations({
                documentClient
            })
        }),
        createHeadlessCmsGraphQL(),
        createFileManagerContext({
            storageOperations: createFileManagerStorageOperations({
                documentClient
            })
        }),
        createFileManagerGraphQL(),
        fileManagerS3(),
        prerenderingServicePlugins({
            eventBus: String(process.env.EVENT_BUS)
        }),
        createPageBuilderContext({
            storageOperations: createPageBuilderStorageOperations({
                documentClient
            })
        }),
        createPageBuilderGraphQL(),
        pageBuilderPrerenderingPlugins(),
        pageBuilderImportExportPlugins({
            storageOperations: createPageBuilderImportExportStorageOperations({ documentClient })
        }),
        createFormBuilder({
            storageOperations: createFormBuilderStorageOperations({
                documentClient
            })
        }),
        createApwGraphQL(),
        createApwPageBuilderContext({
            storageOperations: createApwSaStorageOperations({ documentClient })
        }),
        createAco(),
        createAcoPageBuilderContext(),
        scaffoldsPlugins(),
        createFileModelModifier(({ modifier }) => {
            modifier.addField({
                id: "carMake",
                fieldId: "carMake",
                label: "Car Make",
                type: "text",
                renderer: {
                    name: "text-input"
                }
            });

            modifier.addField({
                id: "year",
                fieldId: "year",
                label: "Year of manufacturing",
                type: "number",
                renderer: {
                    name: "number-input"
                }
            });
        }),
        createAuditLogs()
    ],
    http: { debug }
});
