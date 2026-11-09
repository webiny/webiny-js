/**
 * Webiny API handler for an AWS Lambda **web function** — storage-agnostic BASE.
 *
 * A web function runs a plain Node HTTP server instead of an event handler: Lambda passes the listen
 * address in `AWS_LAMBDA_HTTP_ENDPOINT` and forwards each HTTP request to it. So the transport here is
 * the standalone Node HTTP one (`NodeHttpFeature` + the `NodeHttp*` decorators), while everything
 * behind it is the AWS composition the other two AWS handlers use: DynamoDB, the storage variant, and
 * the per-request stack with the AWS transports (S3, EventBridge Scheduler, API Gateway WebSockets).
 *
 * Web functions only serve HTTP. Every other invocation (background tasks, EventBridge, scheduled
 * actions, WebSocket `$connect`) still targets the regular `graphql` Lambda, so none of those event
 * types are registered here.
 */
import { getDocumentClient } from "@webiny/aws-sdk/client-dynamodb/index.js";
import { createServerHandler } from "@webiny/event-handler-standalone";
import { NodeHttpFeature } from "@webiny/event-handler-standalone";
import { BackgroundTasksAwsFeature } from "@webiny/background-tasks-aws";
import { NodeHttpIdentityLoaderDecorator } from "@webiny/api-event-handler-core/nodeHttp/index.js";
import { NodeHttpTenantLoaderDecorator } from "@webiny/api-event-handler-core/nodeHttp/index.js";
import { NodeHttpAssumePermissionsDecorator } from "@webiny/api-event-handler-core/nodeHttp/index.js";
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
        root: async container => {
            // ── Transport ──────────────────────────────────────────────
            NodeHttpFeature.register(container);

            // ── Tenant + auth (extract → shared load) ──────────────────
            // Same order as the other AWS handlers: later registrations wrap earlier ones, so tenant
            // runs first, then identity, then the router. The identity decorator reads
            // `X-Webiny-Authorization` before `Authorization`.
            container.registerDecorator(NodeHttpIdentityLoaderDecorator);
            container.registerDecorator(NodeHttpTenantLoaderDecorator);
            container.registerDecorator(NodeHttpAssumePermissionsDecorator);

            // ── Background tasks: outbound dispatch only ───────────────
            // Same reason as the streaming handler: `TaskService.trigger()` needs the Step Functions
            // dispatcher, and Step Functions invokes the regular `graphql` Lambda, never this one.
            BackgroundTasksAwsFeature.register(container);

            const documentClient = config.documentClient ?? getDocumentClient();
            await registerWebinyApiRoot(container, config, documentClient);
        },

        child: async container => {
            await registerWebinyApiChild(container, config);
        }
    });
}
