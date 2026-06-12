/**
 * DI-native API GraphQL handler (work in progress).
 * Replaces the plugin-based index.ts incrementally as packages migrate.
 *
 * STATUS: packages marked ✅ are fully migrated; ⏳ still use legacy plugins.
 */
import { getDocumentClient } from "@webiny/aws-sdk/client-dynamodb/index.js";
import { createSchedulerClient } from "@webiny/aws-sdk/client-scheduler/index.js";
import { createLambdaHandler, ApiGatewayFeature, ApiGatewaySecurityFeature } from "@webiny/event-handler-aws"; // ✅
import { GraphQLEngineFeature } from "@webiny/handler-graphql"; // ✅
import { DbFeature } from "@webiny/handler-db"; // ✅
import { ApiCoreFeature } from "@webiny/api-core"; // ✅
import { createApiCoreDdb } from "@webiny/api-core-ddb"; // ✅
import { HeadlessCmsFeature } from "@webiny/api-headless-cms"; // ✅
import { HeadlessCmsDdbFeature } from "@webiny/api-headless-cms-ddb"; // ✅
import { MailerFeature } from "@webiny/api-mailer"; // ✅
import { RecordLockingAppFeature } from "@webiny/api-record-locking"; // ✅
import { AuditLogsFeature } from "@webiny/api-audit-logs"; // ✅
import { AuditLogsDdbFeature } from "@webiny/api-audit-logs-ddb"; // ✅
import { WebhooksFeature } from "@webiny/webhooks/api"; // ✅
import { AcoFeature } from "@webiny/api-aco"; // ✅
import { AcoDdbFeature } from "@webiny/api-aco-ddb"; // ✅
import { AcoHcmsFeature } from "@webiny/api-headless-cms-aco"; // ✅
import { BackgroundTasksFeature } from "@webiny/background-tasks/api"; // ✅
import { HcmsTasksFeature } from "@webiny/api-headless-cms-tasks"; // ✅
import { WebsocketsFeature } from "@webiny/api-websockets"; // ✅
import { WebsocketsDdbFeature } from "@webiny/api-websockets-ddb"; // ✅
import { WorkflowsFeature } from "@webiny/api-workflows"; // ✅
import { CmsWorkflowsFeature } from "@webiny/api-headless-cms-workflows"; // ✅
import { WebsiteBuilderWorkflowsFeature } from "@webiny/api-website-builder-workflows"; // ✅
import { SchedulerFeature } from "@webiny/api-scheduler"; // ✅
import { CmsSchedulerFeature } from "@webiny/api-headless-cms-scheduler"; // ✅
import { WebsiteBuilderSchedulerFeature } from "@webiny/api-website-builder-scheduler"; // ✅

// ⏳ Not yet migrated — still using legacy plugin system
import { createFileManagerContext, createFileManagerGraphQL } from "@webiny/api-file-manager";
import { createFileManagerAco } from "@webiny/api-file-manager-aco";
import { createAssetDelivery, createFileManagerS3 } from "@webiny/api-file-manager-s3";
import { createWebsiteBuilder } from "@webiny/api-website-builder";

import { extensions } from "./extensions";

const documentClient = getDocumentClient();

export const handler = createLambdaHandler({
    root: async container => {
        // ── Transport ──────────────────────────────────────────────
        ApiGatewayFeature.register(container);
        ApiGatewaySecurityFeature.register(container);

        // ── Database ───────────────────────────────────────────────
        DbFeature.register(container, {
            documentClient,
            table: process.env.DB_TABLE
        });

        // ── Core API ───────────────────────────────────────────────
        ApiCoreFeature.register(container, {
            ...createApiCoreDdb({ documentClient }),
            wcpLicense: undefined
        });

        // ── Storage (DDB registries) ───────────────────────────────
        HeadlessCmsDdbFeature.register(container);
        AuditLogsDdbFeature.register(container);
        AcoDdbFeature.register(container);
        WebsocketsDdbFeature.register(container);
    },

    request: async container => {
        // ── CMS ────────────────────────────────────────────────────
        HeadlessCmsFeature.register(container, { type: "manage" });
        AcoFeature.register(container);
        AcoHcmsFeature.register(container);
        HcmsTasksFeature.register(container);

        // ── Websockets ─────────────────────────────────────────────
        WebsocketsFeature.register(container);

        // ── Supporting services ────────────────────────────────────
        MailerFeature.register(container);
        RecordLockingAppFeature.register(container);
        AuditLogsFeature.register(container);
        WebhooksFeature.register(container);
        BackgroundTasksFeature.register(container);

        // ── Workflows ──────────────────────────────────────────────
        WorkflowsFeature.register(container);
        CmsWorkflowsFeature.register(container);
        WebsiteBuilderWorkflowsFeature.register(container);

        // ── Scheduler ──────────────────────────────────────────────
        SchedulerFeature.register(container, {
            getClient: config => createSchedulerClient(config)
        });
        CmsSchedulerFeature.register(container);
        WebsiteBuilderSchedulerFeature.register(container);

        // ── GraphQL engine (always last) ───────────────────────────
        GraphQLEngineFeature.register(container);

        // ── ⏳ Legacy plugins (not yet migrated) ───────────────────
        // TODO: createFileManagerContext()  → FileManagerFeature
        // TODO: createFileManagerGraphQL()  → FileManagerFeature
        // TODO: createFileManagerAco()      → FileManagerAcoFeature
        // TODO: createAssetDelivery()       → FileManagerS3Feature
        // TODO: createFileManagerS3()       → FileManagerS3Feature
        // TODO: createWebsiteBuilder()      → WebsiteBuilderFeature
        // TODO: extensions()
    }
});
