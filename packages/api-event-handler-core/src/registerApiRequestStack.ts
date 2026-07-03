import type { Container } from "@webiny/di";
import { registerExtensions } from "@webiny/handler";
import { GraphQLEngineFeature } from "@webiny/handler-graphql";
import { ApiCoreFeature } from "@webiny/api-core";
import { HeadlessCmsFeature } from "@webiny/api-headless-cms";
import { AcoHcmsFeature } from "@webiny/api-headless-cms-aco";
import { HcmsTasksFeature } from "@webiny/api-headless-cms-tasks";
import { CmsWorkflowsFeature } from "@webiny/api-headless-cms-workflows";
import { CmsSchedulerFeature } from "@webiny/api-headless-cms-scheduler";
import { MailerFeature } from "@webiny/api-mailer";
import { RecordLockingAppFeature } from "@webiny/api-record-locking";
import { AuditLogsFeature } from "@webiny/api-audit-logs";
import { WebhooksFeature } from "@webiny/webhooks/api";
import { AcoFeature } from "@webiny/api-aco";
import { BackgroundTasksFeature } from "@webiny/background-tasks/api";
import { FileManagerAppFeature } from "@webiny/api-file-manager";
import { FileManagerAcoFeature } from "@webiny/api-file-manager-aco";
import { FileManagerS3Feature } from "@webiny/api-file-manager-s3";
import { WebsiteBuilderFeature, setupWebsiteBuilderModels } from "@webiny/api-website-builder";
import { WebsiteBuilderWorkflowsFeature } from "@webiny/api-website-builder-workflows";
import { WebsiteBuilderSchedulerFeature } from "@webiny/api-website-builder-scheduler";
import { WebsocketsFeature } from "@webiny/api-websockets";
import { WorkflowsFeature } from "@webiny/api-workflows";
import { SchedulerFeature } from "@webiny/api-scheduler";

export interface RegisterApiRequestStackConfig {
    /**
     * Project-defined extensions, applied at register() time (so extension features — including
     * code-defined CMS models — are registered before any initializer lists/caches the model set).
     */
    extensions: () => Parameters<typeof registerExtensions>[1];
    /**
     * Register request-phase storage features that must run BEFORE `HeadlessCmsFeature` builds its
     * storage — e.g. `DbRegistryFeature` for the DDB+ES variant. Optional (DDB-only needs none).
     */
    registerRequestStorage?: (container: Container) => void | Promise<void>;
    /**
     * Register the real-time (websockets) transport, run immediately AFTER the transport-agnostic
     * `WebsocketsFeature`. On AWS this is `WebsocketsAwsFeature` (API Gateway Management API); it
     * MUST register after WebsocketsFeature so it overrides the NullWebsocketsTransport
     * (nearest-container-last-wins), otherwise every server→client send() is a silent no-op.
     * Optional — omit for transports with no real-time push.
     */
    registerRealtimeTransport?: (container: Container) => void | Promise<void>;
    /**
     * Register the scheduler transport, run AFTER `SchedulerFeature` and BEFORE `CmsSchedulerFeature`.
     * On AWS this bridges the scheduler-aws extension (EventBridge Scheduler). Optional.
     */
    registerSchedulerTransport?: (container: Container) => void | Promise<void>;
}

/**
 * Registers the transport-AGNOSTIC Webiny API request stack: every domain feature + the GraphQL
 * engine, in the correct (order-sensitive) sequence. This is shared by all transport composition
 * packages (`@webiny/api-event-handler-aws`, and the future `-server`) so the feature set and its
 * ordering live in ONE place and can't drift between transports.
 *
 * Transport- and storage-specific pieces are injected via the hooks in {@link RegisterApiRequestStackConfig}
 * at their exact interleave points. The caller is responsible for the ROOT-container transport wiring
 * (HTTP/event transport, auth/tenant loaders, identity provider, DB + storage) before dispatch reaches
 * this per-request stack.
 *
 * ORDER IS LOAD-BEARING — do not reorder. Notably: extensions must be applied before any initializer
 * (e.g. ACO) lists + caches the per-request model set; the GraphQL engine must be registered last.
 */
export async function registerApiRequestStack(
    container: Container,
    config: RegisterApiRequestStackConfig
): Promise<void> {
    // ── Core API (per-request: EventPublisher + tenant/identity/request contexts must bind to the
    // request child container so per-request event handlers are resolvable) ─────────
    ApiCoreFeature.register(container, { wcpLicense: undefined });

    // ── Request-phase storage (variant-specific; must precede HeadlessCmsFeature) ──
    await config.registerRequestStorage?.(container);

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

    // ── Websockets (domain) + real-time transport ──────────────
    WebsocketsFeature.register(container);
    await config.registerRealtimeTransport?.(container);

    // ── Supporting services ────────────────────────────────────
    MailerFeature.register(container);
    RecordLockingAppFeature.register(container, {});
    AuditLogsFeature.register(container, {});
    WebhooksFeature.register(container);
    BackgroundTasksFeature.register(container);

    // ── Workflows ──────────────────────────────────────────────
    WorkflowsFeature.register(container);
    CmsWorkflowsFeature.register(container);

    // ── Scheduler + scheduler transport ────────────────────────
    SchedulerFeature.register(container);
    await config.registerSchedulerTransport?.(container);
    CmsSchedulerFeature.register(container);

    // ── Extensions ─────────────────────────────────────────────
    // Apply at register() time (not via a post-auth initializer) so extension features — including
    // code-defined CMS models (ModelFactory), e.g. Languages — are registered before any initializer
    // (e.g. ACO) lists + caches the per-request model set.
    await registerExtensions(container, config.extensions());

    // ── GraphQL engine (always last) ───────────────────────────
    GraphQLEngineFeature.register(container);
}
