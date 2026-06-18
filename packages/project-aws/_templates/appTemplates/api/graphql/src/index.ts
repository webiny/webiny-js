/**
 * DI-native API GraphQL handler — fully migrated from plugin-based system.
 */
import { getDocumentClient } from "@webiny/aws-sdk/client-dynamodb/index.js";
import { createSchedulerClient } from "@webiny/aws-sdk/client-scheduler/index.js";
import {
    createLambdaHandler,
    ApiGatewayFeature,
    ApiGatewaySecurityFeature,
    BackgroundTaskEventType
} from "@webiny/event-handler-aws";
import { BackgroundTaskLambdaHandler } from "@webiny/background-tasks/api";
import { registerLegacyPlugins } from "@webiny/handler-graphql";
import { GraphQLEngineFeature } from "@webiny/handler-graphql";
import { DbFeature } from "@webiny/handler-db";
import { ApiCoreFeature } from "@webiny/api-core";
import { createApiCoreDdb } from "@webiny/api-core-ddb";
import { HeadlessCmsFeature } from "@webiny/api-headless-cms";
import { HeadlessCmsDdbFeature } from "@webiny/api-headless-cms-ddb";
import { MailerFeature } from "@webiny/api-mailer";
import { RecordLockingAppFeature } from "@webiny/api-record-locking";
import { AuditLogsFeature } from "@webiny/api-audit-logs";
import { AuditLogsDdbFeature } from "@webiny/api-audit-logs-ddb";
import { WebhooksFeature } from "@webiny/webhooks/api";
import { AcoFeature } from "@webiny/api-aco";
import { AcoDdbFeature } from "@webiny/api-aco-ddb";
import { AcoHcmsFeature } from "@webiny/api-headless-cms-aco";
import { BackgroundTasksFeature } from "@webiny/background-tasks/api";
import { HcmsTasksFeature } from "@webiny/api-headless-cms-tasks";
import { WebsocketsFeature } from "@webiny/api-websockets";
import { WebsocketsDdbFeature } from "@webiny/api-websockets-ddb";
import { WorkflowsFeature } from "@webiny/api-workflows";
import { CmsWorkflowsFeature } from "@webiny/api-headless-cms-workflows";
import { WebsiteBuilderWorkflowsFeature } from "@webiny/api-website-builder-workflows";
import { SchedulerFeature } from "@webiny/api-scheduler";
import { CmsSchedulerFeature } from "@webiny/api-headless-cms-scheduler";
import { WebsiteBuilderSchedulerFeature } from "@webiny/api-website-builder-scheduler";
import { FileManagerAppFeature } from "@webiny/api-file-manager";
import { FileManagerAcoFeature } from "@webiny/api-file-manager-aco";
import { FileManagerS3Feature } from "@webiny/api-file-manager-s3";
import { WebsiteBuilderFeature, setupWebsiteBuilderModels } from "@webiny/api-website-builder";
// CognitoIdpFeature must be in the root container so the ApiGatewayAuthDecorator
// (a root singleton) sees CognitoIdentityProvider when it is first instantiated.
// Extensions register in the child/request container — too late for the auth decorator.
import { CognitoIdpFeature } from "@webiny/cognito/api/features/CognitoIdp/feature.js";

import { extensions } from "./extensions";

const documentClient = getDocumentClient();

export const handler = createLambdaHandler({
    root: async container => {
        // ── Transport ──────────────────────────────────────────────
        ApiGatewayFeature.register(container);
        ApiGatewaySecurityFeature.register(container);

        // Background task invocations (Step Functions → Lambda directly)
        container.register(BackgroundTaskEventType);
        container.register(BackgroundTaskLambdaHandler);

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

        // ── Identity providers ─────────────────────────────────────
        // Must be in root so the ApiGatewayAuthDecorator singleton can
        // authenticate requests before the GraphQL engine runs.
        CognitoIdpFeature.register(container);

        // ── DDB storage registries ─────────────────────────────────
        HeadlessCmsDdbFeature.register(container);
        AuditLogsDdbFeature.register(container, {});
        AcoDdbFeature.register(container);
        WebsocketsDdbFeature.register(container);
    },

    request: async container => {
        // ── CMS ────────────────────────────────────────────────────
        HeadlessCmsFeature.register(container, { type: "manage" });
        AcoFeature.register(container);
        AcoHcmsFeature.register(container);
        HcmsTasksFeature.register(container);

        // ── File Manager ───────────────────────────────────────────
        FileManagerAppFeature.register(container);
        FileManagerAcoFeature.register(container);
        FileManagerS3Feature.register(container, {});

        // ── Website Builder ────────────────────────────────────────
        WebsiteBuilderFeature.register(container);
        await setupWebsiteBuilderModels(container);
        WebsiteBuilderWorkflowsFeature.register(container);
        WebsiteBuilderSchedulerFeature.register(container);

        // ── Websockets ─────────────────────────────────────────────
        WebsocketsFeature.register(container);

        // ── Supporting services ────────────────────────────────────
        MailerFeature.register(container);
        RecordLockingAppFeature.register(container, {});
        AuditLogsFeature.register(container, {});
        WebhooksFeature.register(container);
        BackgroundTasksFeature.register(container);

        // ── Workflows ──────────────────────────────────────────────
        WorkflowsFeature.register(container);
        CmsWorkflowsFeature.register(container);

        // ── Scheduler ──────────────────────────────────────────────
        SchedulerFeature.register(container, {
            getClient: config => createSchedulerClient(config)
        });
        CmsSchedulerFeature.register(container);

        // ── Extensions (legacy escape hatch) ──────────────────────
        registerLegacyPlugins(container, extensions());

        // ── GraphQL engine (always last) ───────────────────────────
        GraphQLEngineFeature.register(container);
    }
});
