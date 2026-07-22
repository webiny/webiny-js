import type { Container } from "@webiny/di";
import { registerExtensions } from "@webiny/handler";
import { GraphQLEngineFeature } from "@webiny/handler-graphql";
import { ApiCoreFeature } from "@webiny/api-core";
import { WcpLicenseInitializer } from "./WcpLicenseInitializer.js";
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
import { WebsiteBuilderFeature, setupWebsiteBuilderModels } from "@webiny/api-website-builder";
import { WebsiteBuilderWorkflowsFeature } from "@webiny/api-website-builder-workflows";
import { WebsiteBuilderSchedulerFeature } from "@webiny/api-website-builder-scheduler";
import { WebsocketsFeature } from "@webiny/api-websockets";
import { WorkflowsFeature } from "@webiny/api-workflows";
import { SchedulerFeature } from "@webiny/api-scheduler";

/** Installs a hosting-specific transport adapter into the per-request container at its interleave point. */
export type TransportRegistrar = (container: Container) => void | Promise<void>;

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
     * Hosting-specific transport adapters, each installed at its exact interleave point in the stack.
     * Every entry follows the same shape: it runs immediately AFTER the transport-agnostic domain
     * Feature has registered its NULL default, and overrides that default (nearest-container-last-wins)
     * with the real adapter. Each is optional — omit one for a deployment/transport that lacks that
     * capability. AWS supplies AWS adapters (API Gateway Management API / EventBridge / S3); the
     * self-hosted server supplies in-process adapters (server WebSockets / Bree / local disk).
     */
    transports?: {
        /**
         * Real-time (WebSockets) transport, run right after `WebsocketsFeature`. Overrides the
         * NullWebsocketsTransport, otherwise every server→client send() is a silent no-op.
         */
        realtime?: TransportRegistrar;
        /**
         * Scheduler transport, run AFTER `SchedulerFeature` and BEFORE `CmsSchedulerFeature`.
         */
        scheduler?: TransportRegistrar;
        /**
         * File-manager storage transport, run AFTER `FileManagerAppFeature` (which registers the
         * AssetDeliveryRoute + NULL asset-delivery impls). Overrides those nulls with real impls and
         * adds the file-operation features.
         */
        fileManager?: TransportRegistrar;
    };
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

    // Refresh the WCP license once per request (RequestInitializer). Lives here (the shared request
    // stack) rather than api-core, so the domain layer has no transport dependency; runs for all
    // hosting types. Registered after ApiCoreFeature (which provides WcpLicenseProvider).
    container.register(WcpLicenseInitializer);

    // ── Request-phase storage (variant-specific; must precede HeadlessCmsFeature) ──
    await config.registerRequestStorage?.(container);

    // ── CMS ────────────────────────────────────────────────────
    HeadlessCmsFeature.register(container, { type: "manage" });
    AcoFeature.register(container);
    AcoHcmsFeature.register(container);
    HcmsTasksFeature.register(container);

    // ── File Manager (domain) + storage transport ──────────────
    FileManagerAppFeature.register(container);
    FileManagerAcoFeature.register(container);
    await config.transports?.fileManager?.(container);

    // ── Website Builder ────────────────────────────────────────
    WebsiteBuilderFeature.register(container);
    await setupWebsiteBuilderModels(container);
    WebsiteBuilderWorkflowsFeature.register(container);
    WebsiteBuilderSchedulerFeature.register(container);

    // ── Websockets (domain) + real-time transport ──────────────
    WebsocketsFeature.register(container);
    await config.transports?.realtime?.(container);

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
    await config.transports?.scheduler?.(container);
    CmsSchedulerFeature.register(container);

    // ── Extensions ─────────────────────────────────────────────
    // Apply at register() time (not via a post-auth initializer) so extension features — including
    // code-defined CMS models (ModelFactory), e.g. Languages — are registered before any initializer
    // (e.g. ACO) lists + caches the per-request model set.
    await registerExtensions(container, config.extensions());

    // ── GraphQL engine (always last) ───────────────────────────
    GraphQLEngineFeature.register(container);
}
