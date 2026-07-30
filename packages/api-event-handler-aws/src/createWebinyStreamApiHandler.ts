/**
 * DI-native Webiny API handler for AWS Lambda **response streaming** — storage-agnostic BASE.
 *
 * This is a SECOND Lambda function sharing the buffered function's code bundle, not a second entry on
 * the same function: a Lambda's handler entry is fixed per function, and a `streamifyResponse` handler
 * is only meaningful under `InvokeMode: RESPONSE_STREAM`. It is reached through a Lambda Function URL
 * (fronted by CloudFront), because API Gateway buffers the entire Lambda response and therefore cannot
 * stream at all.
 *
 * Root/request registration is shared with `createWebinyApiHandler` via `registerWebinyApi.ts`; only
 * the transport differs. Notably NOT registered here: the background-task and WebSocket event types
 * plus their Lambda handlers. Those are inbound invocation paths that only ever target the buffered
 * function, so registering them would add cold-start cost for events this function never receives.
 * The websockets *outbound* transport IS present — it comes from the shared per-request stack, and
 * streaming routes rely on it to push completion messages.
 */
import { getDocumentClient } from "@webiny/aws-sdk/client-dynamodb/index.js";
import { createStreamLambdaHandler, FunctionUrlStreamFeature } from "@webiny/event-handler-aws";
import { FunctionUrlStreamIdentityLoaderDecorator } from "~/handlers/FunctionUrlStreamIdentityLoaderDecorator.js";
import { FunctionUrlStreamTenantLoaderDecorator } from "~/handlers/FunctionUrlStreamTenantLoaderDecorator.js";
import { registerWebinyApiRequest, registerWebinyApiRoot } from "~/registerWebinyApi.js";
import type { WebinyApiCompositionConfig } from "~/registerWebinyApi.js";

export type CreateWebinyStreamApiHandlerConfig = WebinyApiCompositionConfig;

export function createWebinyStreamApiHandler(config: CreateWebinyStreamApiHandlerConfig) {
    return createStreamLambdaHandler({
        root: async container => {
            // ── Transport ──────────────────────────────────────────────
            // Registers the Function URL event type + router + the streaming terminal handler.
            // Deliberately NOT alongside ApiGatewayFeature: both event types match the same payload
            // shape, so they must never share a container.
            FunctionUrlStreamFeature.register(container);

            // ── Auth + tenant (extract → shared load) ──────────────────
            // registerDecorator applies LATER registrations as the OUTER wrapper (whose execute() runs
            // first), so register tenant first (inner) and identity last (outer) → identity runs, then
            // tenant, then the router.
            container.registerDecorator(FunctionUrlStreamTenantLoaderDecorator);
            container.registerDecorator(FunctionUrlStreamIdentityLoaderDecorator);

            // Resolved here rather than at factory time: one bundle exports BOTH this handler and the
            // buffered one, so building the client eagerly would open a second DynamoDB client on every
            // cold start of whichever function isn't streaming. `root` runs once, lazily.
            await registerWebinyApiRoot(
                container,
                config,
                config.documentClient ?? getDocumentClient()
            );
        },

        request: async container => {
            await registerWebinyApiRequest(container, config);
        }
    });
}
