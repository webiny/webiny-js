import { resolve } from "path";
import knexLib from "knex";
import { createHandler } from "@webiny/handler-aws";
import graphqlPlugins from "@webiny/handler-graphql";
import { createApiCore } from "@webiny/api-core";
import { createApiCoreSql, registerSQLCore } from "@webiny/api-core-sql";
import { createFileManagerContext, createFileManagerGraphQL } from "@webiny/api-file-manager";
import { createFileManagerAco } from "@webiny/api-file-manager-aco";
import { createAssetDelivery, createFileManagerS3 } from "@webiny/api-file-manager-s3";
import { createCmsExtension } from "@webiny/api-headless-cms";
import { registerSqlStorageOperations } from "@webiny/api-headless-cms-sql";
import { createAco } from "@webiny/api-aco";
import { registerAcoSqlStorageOperations } from "@webiny/api-aco-sql";
import { createAcoHcmsContext } from "@webiny/api-headless-cms-aco";
import securityPlugins from "./security.js";
import { createWebsiteBuilder } from "@webiny/api-website-builder";
import { createAuditLogs } from "@webiny/api-audit-logs";
import { registerAuditLogsSqlStorageOperations } from "@webiny/api-audit-logs-sql";
import { createBackgroundTasks } from "@webiny/api-background-tasks-os";
import { createWebsockets } from "@webiny/api-websockets";
import { createAwsWebsockets } from "@webiny/api-websockets-aws";
import { registerWebsocketsSqlStorageOperations } from "@webiny/api-websockets-sql";
import { createRecordLocking } from "@webiny/api-record-locking";
import { registerSchedulerExtension } from "@webiny/api-scheduler";
import { registerSchedulerServerExtension } from "@webiny/api-scheduler-server";
import { createHeadlessCmsScheduler } from "@webiny/api-headless-cms-scheduler";
import { createMailerContext, createMailerGraphQL } from "@webiny/api-mailer";
import { createWorkflows } from "@webiny/api-workflows";
import { createHeadlessCmsWorkflows } from "@webiny/api-headless-cms-workflows";
import { createWebsiteBuilderWorkflows } from "@webiny/api-website-builder-workflows";
import { createWebsiteBuilderScheduler } from "@webiny/api-website-builder-scheduler";
import { createWebhooks } from "@webiny/webhooks/api";

import { extensions } from "./extensions";

const debug = process.env.DEBUG === "true";

const knex = knexLib({
    client: "better-sqlite3",
    connection: {
        filename: resolve(process.cwd(), "db", "webiny.db")
    },
    useNullAsDefault: true
});

export const handler = createHandler({
    plugins: [
        registerSQLCore({
            knex
        }),
        createApiCore({
            storageOperations: createApiCoreSql({ knex })
        }),
        graphqlPlugins({ debug }),
        securityPlugins(),
        createWebsockets(),
        createAwsWebsockets(),
        registerWebsocketsSqlStorageOperations({ knex }),
        registerSqlStorageOperations({
            knex
        }),
        createCmsExtension(),
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
        registerAcoSqlStorageOperations({ knex }),
        createAco(),
        createWorkflows(),
        createHeadlessCmsWorkflows(),
        createWebsiteBuilderWorkflows(),
        registerAuditLogsSqlStorageOperations({
            knex
        }),
        createAuditLogs(),
        createAcoHcmsContext(),
        registerSchedulerExtension(),
        registerSchedulerServerExtension(),
        createHeadlessCmsScheduler(),
        createWebsiteBuilderScheduler(),
        createWebhooks(),
        extensions()
    ],
    debug
});
