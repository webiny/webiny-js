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
import { createServerHandler, NodeHttpFeature } from "@webiny/event-handler-standalone";
import { BackgroundTasksAwsFeature } from "@webiny/background-tasks-aws";
import {
    NodeHttpAssumePermissionsDecorator,
    NodeHttpIdentityLoaderDecorator,
    NodeHttpTenantLoaderDecorator
} from "@webiny/api-event-handler-core";
import { registerWebinyApiChild, registerWebinyApiRoot } from "~/composition/index.js";
import type { WebinyApiCompositionConfig } from "~/composition/index.js";

export type CreateWebinyWebApiHandlerConfig = WebinyApiCompositionConfig;

/**
 * Used when `AWS_LAMBDA_HTTP_ENDPOINT` is not set, i.e. when running the bundle outside Lambda.
 */
const DEFAULT_ENDPOINT = "127.0.0.1:3000";

export function createWebinyWebApiHandler(config: CreateWebinyWebApiHandlerConfig) {
    return createServerHandler({
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

            await registerWebinyApiRoot(
                container,
                config,
                config.documentClient ?? getDocumentClient()
            );
        },

        child: async container => {
            await registerWebinyApiChild(container, config);
        }
    });
}

/**
 * Creates the server and starts listening on the address Lambda gives in `AWS_LAMBDA_HTTP_ENDPOINT`.
 * Lambda requires the server to listen within 10 seconds of start, so the root container is NOT built
 * here; it is built on the first request.
 */
export async function startWebinyWebApi(config: CreateWebinyWebApiHandlerConfig): Promise<void> {
    const endpoint = process.env.AWS_LAMBDA_HTTP_ENDPOINT || DEFAULT_ENDPOINT;
    const separator = endpoint.lastIndexOf(":");
    const hostname = endpoint.slice(0, separator);
    const port = Number(endpoint.slice(separator + 1));

    const server = await createWebinyWebApiHandler(config);

    // Lambda sends SIGTERM before it shuts an environment down. Let in-flight requests finish.
    process.once("SIGTERM", () => {
        server.close(() => process.exit(0));
    });

    await new Promise<void>((resolve, reject) => {
        server.once("error", reject);
        server.listen(port, hostname, () => {
            server.off("error", reject);
            resolve();
        });
    });
}
