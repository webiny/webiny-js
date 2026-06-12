/**
 * DI-native API GraphQL handler (work in progress).
 * Replaces the plugin-based index.ts incrementally as packages migrate.
 *
 * STATUS: packages marked ✅ are fully migrated; ⏳ still use legacy plugins.
 */
import { getDocumentClient } from "@webiny/aws-sdk/client-dynamodb/index.js";
import { createLambdaHandler, ApiGatewayFeature, ApiGatewaySecurityFeature } from "@webiny/event-handler-aws"; // ✅
import { GraphQLEngineFeature } from "@webiny/handler-graphql"; // ✅
import { DbFeature } from "@webiny/handler-db"; // ✅
import { ApiCoreFeature } from "@webiny/api-core"; // ✅
import { createApiCoreDdb } from "@webiny/api-core-ddb"; // ✅ (storage ops factory, no plugins needed)
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

// ⏳ Not yet migrated — still using legacy plugin system
import { createWebsockets } from "@webiny/api-websockets";
import { createFileManagerContext, createFileManagerGraphQL } from "@webiny/api-file-manager";
import { createFileManagerAco } from "@webiny/api-file-manager-aco";
import { createAssetDelivery, createFileManagerS3 } from "@webiny/api-file-manager-s3";
import { createWebsiteBuilder } from "@webiny/api-website-builder";
import { createWorkflows } from "@webiny/api-workflows";
import { createHeadlessCmsWorkflows } from "@webiny/api-headless-cms-workflows";
import { createWebsiteBuilderWorkflows } from "@webiny/api-website-builder-workflows";
import { createScheduler } from "@webiny/api-scheduler";
import { createHeadlessCmsScheduler } from "@webiny/api-headless-cms-scheduler";
import { createWebsiteBuilderScheduler } from "@webiny/api-website-builder-scheduler";

import { extensions } from "./extensions";

const documentClient = getDocumentClient();

export const handler = createLambdaHandler({
    root: async container => {
        // ── Transport ──────────────────────────────────────────────
        ApiGatewayFeature.register(container);          // event routing + HttpRouter
        ApiGatewaySecurityFeature.register(container);  // auth + tenant decorators

        // ── Database ───────────────────────────────────────────────
        DbFeature.register(container, {
            documentClient,
            table: process.env.DB_TABLE
        });

        // ── Core API ───────────────────────────────────────────────
        ApiCoreFeature.register(container, {
            ...createApiCoreDdb({ documentClient }),
            wcpLicense: undefined // loaded from env by ApiCoreFeature
        });

        // ── CMS storage ────────────────────────────────────────────
        HeadlessCmsDdbFeature.register(container);
        AuditLogsDdbFeature.register(container);
        AcoDdbFeature.register(container);
    },

    request: async container => {
        // ── CMS ────────────────────────────────────────────────────
        HeadlessCmsFeature.register(container, { type: "manage" });
        AcoFeature.register(container);
        AcoHcmsFeature.register(container);
        HcmsTasksFeature.register(container);

        // ── Supporting services ────────────────────────────────────
        MailerFeature.register(container);
        RecordLockingAppFeature.register(container);
        AuditLogsFeature.register(container);
        WebhooksFeature.register(container);
        BackgroundTasksFeature.register(container);

        // ── GraphQL engine (always last) ───────────────────────────
        GraphQLEngineFeature.register(container);

        // ── ⏳ Legacy plugins (not yet migrated) ───────────────────
        // TODO: createWebsockets()          → WebsocketsFeature
        // TODO: createFileManagerContext()  → FileManagerFeature
        // TODO: createFileManagerGraphQL()  → FileManagerFeature
        // TODO: createFileManagerAco()      → FileManagerAcoFeature
        // TODO: createAssetDelivery()       → FileManagerS3Feature
        // TODO: createFileManagerS3()       → FileManagerS3Feature
        // TODO: createWebsiteBuilder()      → WebsiteBuilderFeature
        // TODO: createWorkflows()           → WorkflowsFeature
        // TODO: createHeadlessCmsWorkflows()
        // TODO: createWebsiteBuilderWorkflows()
        // TODO: createScheduler()           → SchedulerFeature
        // TODO: createHeadlessCmsScheduler()
        // TODO: createWebsiteBuilderScheduler()
        // TODO: extensions()
    }
});
