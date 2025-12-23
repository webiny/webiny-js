import { getDocumentClient } from "@webiny/aws-sdk/client-dynamodb";
import { createHandler } from "@webiny/handler-aws";
import graphqlPlugins from "@webiny/handler-graphql";
import { createApiCore } from "@webiny/api-core";
import { createApiCoreDdb } from "@webiny/api-core-ddb";
import dbPlugins from "@webiny/handler-db";
import { DynamoDbDriver } from "@webiny/db-dynamodb";
import dynamoDbPlugins from "@webiny/db-dynamodb/plugins";
import elasticsearchClientContext, { createElasticsearchClient } from "@webiny/api-elasticsearch";
import { createFileManagerContext, createFileManagerGraphQL } from "@webiny/api-file-manager";
import { createFileManagerS3, createAssetDelivery } from "@webiny/api-file-manager-s3";
import { createHeadlessCmsContext, createHeadlessCmsGraphQL } from "@webiny/api-headless-cms";
import { createStorageOperations as createHeadlessCmsStorageOperations } from "@webiny/api-headless-cms-ddb-es";
import { createHcmsTasks } from "@webiny/api-headless-cms-tasks-ddb-es";
import { createAco } from "@webiny/api-aco";
import { createAcoHcmsContext } from "@webiny/api-headless-cms-aco";
import securityPlugins from "./security";
import { createWebsiteBuilder } from "@webiny/api-website-builder";
import { createAuditLogs } from "@webiny/api-audit-logs";
import { createBackgroundTasks } from "@webiny/api-background-tasks-os";
import { createWebsockets } from "@webiny/api-websockets";
import { createRecordLocking } from "@webiny/api-record-locking";
import { createHeadlessCmsScheduler } from "@webiny/api-headless-cms-scheduler";
import { createSchedulerClient } from "@webiny/aws-sdk/client-scheduler";
import { createMailerContext, createMailerGraphQL } from "@webiny/api-mailer";

import { extensions } from "./extensions";

const debug = process.env.DEBUG === "true";

const documentClient = getDocumentClient();

const elasticsearchClient = createElasticsearchClient({
    endpoint: `https://${process.env.ELASTIC_SEARCH_ENDPOINT}`
});

export const handler = createHandler({
    plugins: [
        createApiCore({
            storageOperations: createApiCoreDdb({ documentClient })
        }),
        dynamoDbPlugins(),
        graphqlPlugins({ debug }),
        elasticsearchClientContext(elasticsearchClient),
        dbPlugins({
            table: process.env.DB_TABLE,
            driver: new DynamoDbDriver({ documentClient })
        }),
        securityPlugins(),
        createWebsockets(),
        createHeadlessCmsContext({
            storageOperations: createHeadlessCmsStorageOperations({
                documentClient,
                elasticsearch: elasticsearchClient,
                plugins: []
            })
        }),
        createHeadlessCmsGraphQL(),
        createMailerContext(),
        createMailerGraphQL(),
        createWebsiteBuilder(),
        createRecordLocking(),
        createBackgroundTasks(),
        createFileManagerContext(),
        createFileManagerGraphQL(),
        createAssetDelivery(),
        createFileManagerS3(),
        createAco({
            documentClient
        }),
        createAcoHcmsContext(),
        createHcmsTasks(),
        createHeadlessCmsScheduler({
            getClient: config => {
                return createSchedulerClient(config);
            }
        }),
        createAuditLogs(),
        extensions()
    ],
    debug
});
