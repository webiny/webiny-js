import { getDocumentClient } from "@webiny/aws-sdk/client-dynamodb/index.js";
import { createHandler } from "@webiny/handler-aws";
import graphqlPlugins from "@webiny/handler-graphql";
import { createApiCore } from "@webiny/api-core";
import { createApiCoreDdb } from "@webiny/api-core-ddb";
import dbPlugins from "@webiny/handler-db";
import { DynamoDbDriver } from "@webiny/db-dynamodb";
import { createFileManagerContext, createFileManagerGraphQL } from "@webiny/api-file-manager";
import { createFileManagerAco } from "@webiny/api-file-manager-aco";
import { createFileManagerS3, createAssetDelivery } from "@webiny/api-file-manager-s3";
import { createHeadlessCmsContext, createHeadlessCmsGraphQL } from "@webiny/api-headless-cms";
import { registerDynamoDbStorageOperations } from "@webiny/api-headless-cms-ddb";
import { createHcmsTasks } from "@webiny/api-headless-cms-tasks";
import { createAco } from "@webiny/api-aco";
import { registerAcoDdbStorageOperations } from "@webiny/api-aco-ddb";
import { createAcoHcmsContext } from "@webiny/api-headless-cms-aco";
import securityPlugins from "./security";
import { createWebsiteBuilder } from "@webiny/api-website-builder";
import { createAuditLogs } from "@webiny/api-audit-logs";
import { registerAuditLogsDdbStorageOperations } from "@webiny/api-audit-logs-ddb";
import { createBackgroundTasks } from "@webiny/api-background-tasks-ddb";
import { createWebsockets } from "@webiny/api-websockets";
import { registerWebsocketsDdbStorageOperations } from "@webiny/api-websockets-ddb";
import { createRecordLocking } from "@webiny/api-record-locking";
import { createHeadlessCmsScheduler } from "@webiny/api-headless-cms-scheduler";
import { createScheduler } from "@webiny/api-scheduler";
import { createSchedulerClient } from "@webiny/aws-sdk/client-scheduler/index.js";
import { createMailerContext, createMailerGraphQL } from "@webiny/api-mailer";
import { createWorkflows } from "@webiny/api-workflows";
import { createHeadlessCmsWorkflows } from "@webiny/api-headless-cms-workflows";
import { createWebsiteBuilderWorkflows } from "@webiny/api-website-builder-workflows";
import { createWebsiteBuilderScheduler } from "@webiny/api-website-builder-scheduler";
import { createWebhooks } from "@webiny/webhooks/api";

import { extensions } from "./extensions";

const debug = process.env.DEBUG === "true";

const documentClient = getDocumentClient();

export const handler = createHandler({
    plugins: [
        createApiCore({
            storageOperations: createApiCoreDdb({ documentClient })
        }),
        graphqlPlugins({ debug }),
        dbPlugins({
            table: process.env.DB_TABLE,
            driver: new DynamoDbDriver({ documentClient })
        }),
        securityPlugins(),
        createWebsockets(),
        registerWebsocketsDdbStorageOperations({ documentClient }),
        registerDynamoDbStorageOperations(),
        createHeadlessCmsContext(),
        createHeadlessCmsGraphQL(),
        createMailerContext(),
        createMailerGraphQL(),
        createWebsiteBuilder(),
        createRecordLocking(),
        createBackgroundTasks(),
        createFileManagerContext(),
        createFileManagerGraphQL(),
        createFileManagerAco(),
        createAssetDelivery(),
        createFileManagerS3(),
        registerAcoDdbStorageOperations({ documentClient }),
        createAco(),
        createWorkflows(),
        createHeadlessCmsWorkflows(),
        createWebsiteBuilderWorkflows(),
        registerAuditLogsDdbStorageOperations({
            documentClient,
        }),
        createAuditLogs(),
        createAcoHcmsContext(),
        createHcmsTasks(),
        createScheduler({
            getClient: config => {
                return createSchedulerClient(config);
            }
        }),
        createHeadlessCmsScheduler(),
        createWebsiteBuilderScheduler(),
        createWebhooks(),
        extensions()
    ],
    debug
});
