import { getDocumentClient } from "@webiny/aws-sdk/client-dynamodb";
import { createHandler } from "@webiny/handler-aws";
import graphqlPlugins from "@webiny/handler-graphql";
import { createWcpContext, createWcpGraphQL } from "@webiny/api-wcp";
import i18nPlugins from "@webiny/api-i18n/graphql";
import i18nDynamoDbStorageOperations from "@webiny/api-i18n-ddb";
import dbPlugins from "@webiny/handler-db";
import { DynamoDbDriver } from "@webiny/db-dynamodb";
import dynamoDbPlugins from "@webiny/db-dynamodb/plugins";
import {
    createFileManagerContext,
    createFileManagerGraphQL,
    createFileModelModifier
} from "@webiny/api-file-manager";
import { createFileManagerStorageOperations } from "@webiny/api-file-manager-ddb";
import fileManagerS3, { createAssetDelivery } from "@webiny/api-file-manager-s3";
import { createHeadlessCmsContext, createHeadlessCmsGraphQL } from "@webiny/api-headless-cms";
import { createAcoHcmsContext } from "@webiny/api-headless-cms-aco";
import { createHcmsTasks } from "@webiny/api-headless-cms-tasks";
import { createStorageOperations as createHeadlessCmsStorageOperations } from "@webiny/api-headless-cms-ddb";
import securityPlugins from "./security";
import tenantManager from "@webiny/api-tenant-manager";
import { createApwContext, createApwGraphQL } from "@webiny/api-apw";
import { createStorageOperations as createApwStorageOperations } from "@webiny/api-apw-scheduler-so-ddb";
import { createAco } from "@webiny/api-aco";
import { createAuditLogs } from "@webiny/api-audit-logs";
import { createBackgroundTasks } from "@webiny/api-background-tasks-ddb";
import { createBenchmarkEnablePlugin } from "~/plugins/benchmarkEnable";
import { createCountDynamoDbTask } from "~/plugins/countDynamoDbTask";
import { createContinuingTask } from "~/plugins/continuingTask";
import { createWebsockets } from "@webiny/api-websockets";
import { createRecordLocking } from "@webiny/api-record-locking";
import { createLogger } from "@webiny/api-log";
import { createWebsiteBuilder } from "@webiny/api-website-builder";

import scaffoldsPlugins from "./plugins/scaffolds";
import { extensions } from "./extensions";
import { createHeadlessCmsScheduler } from "@webiny/api-headless-cms-scheduler";
/**
 * #### TESTING sync system
 */
import { createSyncSystem } from "@webiny/api-sync-system";
import { createEventBridgeClient } from "@webiny/aws-sdk/client-eventbridge/index.js";
import { createSchedulerClient } from "@webiny/aws-sdk/client-scheduler";

const debug = process.env.DEBUG === "true";
const documentClient = getDocumentClient();

const syncSystem = createSyncSystem({
    getDocumentClient: () => {
        return documentClient;
    },
    getEventBridgeClient: params => {
        return createEventBridgeClient(params);
    },
    system: {
        env: process.env.WEBINY_ENV,
        variant: process.env.WEBINY_ENV_VARIANT,
        region: process.env.AWS_REGION,
        version: process.env.WEBINY_VERSION
    },
    plugins: []
});
/**
 * ####
 */

export const handler = createHandler({
    plugins: [
        syncSystem.plugins(),
        createBenchmarkEnablePlugin(),
        createWcpContext(),
        createWcpGraphQL(),
        dynamoDbPlugins(),
        graphqlPlugins({ debug }),
        dbPlugins({
            table: process.env.DB_TABLE,
            driver: new DynamoDbDriver({ documentClient })
        }),
        securityPlugins({ documentClient }),
        createLogger({
            documentClient
        }),
        tenantManager(),
        i18nPlugins(),
        i18nDynamoDbStorageOperations(),
        createWebsockets(),
        createHeadlessCmsContext({
            storageOperations: createHeadlessCmsStorageOperations({
                documentClient
            })
        }),
        createHeadlessCmsGraphQL(),
        createRecordLocking(),
        createBackgroundTasks(),
        createFileManagerContext({
            storageOperations: createFileManagerStorageOperations({
                documentClient
            })
        }),
        createFileManagerGraphQL(),
        createAssetDelivery({ documentClient }),
        fileManagerS3(),
        createApwContext({
            storageOperations: createApwStorageOperations({ documentClient })
        }),
        createApwGraphQL(),
        createAco({
            documentClient
        }),
        createAcoHcmsContext(),
        createHcmsTasks(),
        createWebsiteBuilder(),
        createFileModelModifier(({ modifier }) => {
            modifier.addField({
                id: "customField1",
                fieldId: "customField1",
                label: "Custom Field 1",
                helpText: "Enter an alphanumeric value.",
                type: "text",
                renderer: {
                    name: "text-input"
                },
                bulkEdit: true
            });

            modifier.addField({
                id: "customField2",
                fieldId: "customField2",
                label: "Custom Field 2",
                helpText: "Enter a numeric value.",
                type: "number",
                renderer: {
                    name: "number-input"
                }
            });
        }),
        createAuditLogs({
            deleteLogsAfterDays: 30
        }),
        createCountDynamoDbTask(),
        createContinuingTask(),
        createHeadlessCmsScheduler({
            getClient: config => {
                return createSchedulerClient(config);
            }
        }),
        // Leave this at the end.
        scaffoldsPlugins(),
        extensions()
    ],
    debug
});
