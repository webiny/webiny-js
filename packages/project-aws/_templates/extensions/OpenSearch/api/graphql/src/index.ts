import { getDocumentClient } from "@webiny/aws-sdk/client-dynamodb/index.js";
import { createHandler } from "@webiny/handler-aws";
import graphqlPlugins from "@webiny/handler-graphql";
import { createApiCore } from "@webiny/api-core";
import { createApiCoreDdb } from "@webiny/api-core-ddb";
import dbPlugins from "@webiny/handler-db";
import { DynamoDbDriver } from "@webiny/db-dynamodb";
import { createOpenSearchContext, createOpenSearchClient } from "@webiny/api-opensearch";
import { createFileManagerContext, createFileManagerGraphQL } from "@webiny/api-file-manager";
import { createFileManagerAco } from "@webiny/api-file-manager-aco";
import { createAssetDelivery, createFileManagerS3 } from "@webiny/api-file-manager-s3";
import { createHeadlessCmsContext, createHeadlessCmsGraphQL } from "@webiny/api-headless-cms";
import { registerCmsOpenSearchStorageOperations } from "@webiny/api-headless-cms-ddb-es";
import { createHcmsTasks } from "@webiny/api-headless-cms-tasks-ddb-es";
import { createAco } from "@webiny/api-aco";
import { registerAcoDdbStorageOperations } from "@webiny/api-aco-ddb";
import { createAcoHcmsContext } from "@webiny/api-headless-cms-aco";
import securityPlugins from "./security.js";
import { createWebsiteBuilder } from "@webiny/api-website-builder";
import { registerAuditLogsDdbStorageOperations } from "@webiny/api-audit-logs-ddb";
import { createAuditLogs } from "@webiny/api-audit-logs";
import { createBackgroundTasks } from "@webiny/api-background-tasks-os";
import { createWebsockets } from "@webiny/api-websockets";
import { createRecordLocking } from "@webiny/api-record-locking";
import { createSchedulerClient } from "@webiny/aws-sdk/client-scheduler/index.js";
import { createScheduler } from "@webiny/api-scheduler";
import { createHeadlessCmsScheduler } from "@webiny/api-headless-cms-scheduler";
import { createMailerContext, createMailerGraphQL } from "@webiny/api-mailer";
import { createWorkflows } from "@webiny/api-workflows";
import { createHeadlessCmsWorkflows } from "@webiny/api-headless-cms-workflows";
import { createWebsiteBuilderWorkflows } from "@webiny/api-website-builder-workflows";
import { createWebsiteBuilderScheduler } from "@webiny/api-website-builder-scheduler";
import { createWebhooks } from "@webiny/webhooks/api";

import { extensions } from "./extensions";

const debug = process.env.DEBUG === "true";

const documentClient = getDocumentClient();

const osUsername = process.env.OPENSEARCH_USERNAME;
const osPassword = process.env.OPENSEARCH_PASSWORD;

const openSearchClientOptions: Parameters<typeof createOpenSearchClient>[0] = {
    endpoint: `https://${process.env.OPENSEARCH_ENDPOINT}`
};
if (osUsername && osPassword) {
    openSearchClientOptions.auth = { username: osUsername, password: osPassword };
}

const openSearchClient = createOpenSearchClient(openSearchClientOptions);

export const handler = createHandler({
    plugins: [
        createApiCore({
            storageOperations: createApiCoreDdb({ documentClient })
        }),
        graphqlPlugins({ debug }),
        createOpenSearchContext(openSearchClient),
        dbPlugins({
            table: process.env.DB_TABLE,
            driver: new DynamoDbDriver({ documentClient })
        }),
        securityPlugins(),
        createWebsockets(),
        registerCmsOpenSearchStorageOperations(),
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
            documentClient
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
