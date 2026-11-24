/**
 * Webiny API handler for an AWS Lambda **web function** — storage-agnostic BASE.
 *
 * A web function runs a plain Node HTTP server instead of an event handler: Lambda passes the listen
 * address in `AWS_LAMBDA_HTTP_ENDPOINT` and forwards each HTTP request to it. So the transport here is
 * the Node HTTP one standalone also uses (`NodeHttpFeature`), while everything
 * behind it is the AWS composition the other two AWS handlers use: the storage variant (database
 * included) and the per-request stack with the AWS transports (S3, EventBridge Scheduler, API Gateway
 * WebSockets).
 *
 * Web functions only serve HTTP. Every other invocation (background tasks, EventBridge, scheduled
 * actions, WebSocket `$connect`) still targets the regular `graphql` Lambda, so none of those event
 * types are registered here.
 */
import { createServerHandler } from "@webiny/event-handler-core/nodeHttp/index.js";
import { LambdaWebHandlerPlatform } from "@webiny/event-handler-aws";
import { NodeHttpFeature } from "@webiny/event-handler-core/nodeHttp/index.js";
import { BackgroundTasksAwsFeature } from "@webiny/background-tasks-aws";
import { HttpRequestContextFeature } from "@webiny/api-event-handler-core";
import { registerWebinyApiChild } from "~/composition/index.js";
import { registerWebinyApiRoot } from "~/composition/index.js";
import type { WebinyApiCompositionConfig } from "~/composition/index.js";

export type CreateWebinyWebApiHandlerConfig = WebinyApiCompositionConfig;

/**
 * Builds the server. `startWebinyWebApi` makes it listen where Lambda says.
 */
export function createWebinyWebApiHandler(config: CreateWebinyWebApiHandlerConfig) {
    return createServerHandler({
        // Lambda sends SIGTERM before it shuts an environment down.
        exitOnShutdownSignal: true,
        // Takes each request's execution id from the `lambda-web-request-id` header.
        platform: LambdaWebHandlerPlatform,
        root: async container => {
            // ── Tenant, identity, preview-as ───────────────────────────
            // Registered BEFORE the transport, which registers HttpFeature, so these decorate
            // HttpRouter from the inside and their responses and errors get the CORS headers. The
            // order inside is in HttpRequestContextFeature.
            HttpRequestContextFeature.register(container);

            // ── Transport ──────────────────────────────────────────────
            NodeHttpFeature.register(container);

            // ── Background tasks: outbound dispatch only ───────────────
            // Same reason as the streaming handler: `TaskService.trigger()` needs the Step Functions
            // dispatcher, and Step Functions invokes the regular `graphql` Lambda, never this one.
            BackgroundTasksAwsFeature.register(container);

            await registerWebinyApiRoot(container, config);
        },

        child: async container => {
            await registerWebinyApiChild(container, config);
        }
    });
}
