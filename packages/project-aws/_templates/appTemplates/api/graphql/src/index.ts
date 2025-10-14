import { getDocumentClient } from "@webiny/aws-sdk/client-dynamodb";
import { createHandler } from "@webiny/handler-aws";
import graphqlPlugins from "@webiny/handler-graphql";
import { createWcpContext, createWcpGraphQL } from "@webiny/api-wcp";
import i18nPlugins from "@webiny/api-i18n/graphql";
import i18nDynamoDbStorageOperations from "@webiny/api-i18n-ddb";
import dbPlugins from "@webiny/handler-db";
import { DynamoDbDriver } from "@webiny/db-dynamodb";
import dynamoDbPlugins from "@webiny/db-dynamodb/plugins";
import { createFileManagerContext, createFileManagerGraphQL } from "@webiny/api-file-manager";
import { createFileManagerStorageOperations } from "@webiny/api-file-manager-ddb";
import fileManagerS3, { createAssetDelivery } from "@webiny/api-file-manager-s3";
import { createHeadlessCmsContext, createHeadlessCmsGraphQL } from "@webiny/api-headless-cms";
import { createStorageOperations as createHeadlessCmsStorageOperations } from "@webiny/api-headless-cms-ddb";
import { createHcmsTasks } from "@webiny/api-headless-cms-tasks";
import { createAco } from "@webiny/api-aco";
import { createAcoHcmsContext } from "@webiny/api-headless-cms-aco";
import securityPlugins from "./security";
import { createWebsiteBuilder } from "@webiny/api-website-builder";
import tenantManager from "@webiny/api-tenant-manager";
import { createAuditLogs } from "@webiny/api-audit-logs";
import { createBackgroundTasks } from "@webiny/api-background-tasks-ddb";
import { createWebsockets } from "@webiny/api-websockets";
import { createRecordLocking } from "@webiny/api-record-locking";
import { createLogger } from "@webiny/api-log";
import { createHeadlessCmsScheduler } from "@webiny/api-headless-cms-scheduler";
import { createSchedulerClient } from "@webiny/aws-sdk/client-scheduler";
import { createMailerContext, createMailerGraphQL } from "@webiny/api-mailer";
import { createWorkflows } from "@webiny/api-workflows";
import { createHeadlessCmsWorkflows } from "@webiny/api-headless-cms-workflows";

import { extensions } from "./extensions";

const debug = process.env.DEBUG === "true";

const documentClient = getDocumentClient();

export const handler = createHandler({
    plugins: [
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
        createMailerContext(),
        createMailerGraphQL(),
        createWebsiteBuilder(),
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
        createAco({
            documentClient
        }),
        createWorkflows(),
        createHeadlessCmsWorkflows(),
        createAuditLogs(),
        createAcoHcmsContext(),
        createHcmsTasks(),
        createHeadlessCmsScheduler({
            getClient: config => {
                return createSchedulerClient(config);
            }
        }),
        extensions()
    ],
    debug
});
