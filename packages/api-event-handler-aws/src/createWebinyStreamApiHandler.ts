/**
 * DI-native Webiny API handler for AWS Lambda **response streaming** — storage-agnostic BASE.
 *
 * This is a SECOND Lambda function sharing the buffered function's code bundle, not a second entry on
 * the same function: a Lambda's handler entry is fixed per function, and a `streamifyResponse` handler
 * is only meaningful under `InvokeMode: RESPONSE_STREAM`. It is reached through a Lambda Function URL
 * (fronted by CloudFront), because API Gateway buffers the entire Lambda response and therefore cannot
 * stream at all.
 *
 * Root/request registration is shared with `createWebinyApiHandler` via `composition/`; only
 * the transport differs. Notably NOT registered here: the background-task and WebSocket **event
 * types**. Those match inbound invocations that only ever target the buffered function, so
 * registering them would add cold-start cost for events this function never receives.
 *
 * Outbound transports are a different matter, and both ARE present: websockets push completion
 * messages from the shared per-request stack, and `BackgroundTasksAwsFeature` supplies the Step
 * Functions dispatcher that `TaskService.trigger()` needs. Omitting the latter does not disable
 * task triggering — it breaks it silently, because the shared root registers `TaskService` either
 * way and its callers treat a failed trigger as a no-op (ACO's FLP handlers, for one, swallow it),
 * so writes land while their projections never update.
 */
import { getDocumentClient } from "@webiny/aws-sdk/client-dynamodb/index.js";
import { createStreamLambdaHandler, FunctionUrlStreamFeature } from "@webiny/event-handler-aws";
import { BackgroundTasksAwsFeature } from "@webiny/background-tasks-aws";
import { FunctionUrlStreamIdentityLoaderDecorator } from "~/handlers/FunctionUrlStreamIdentityLoaderDecorator.js";
import { FunctionUrlStreamTenantLoaderDecorator } from "~/handlers/FunctionUrlStreamTenantLoaderDecorator.js";
import { registerWebinyApiChild, registerWebinyApiRoot } from "~/composition/index.js";
import type { WebinyApiCompositionConfig } from "~/composition/index.js";

export type CreateWebinyStreamApiHandlerConfig = WebinyApiCompositionConfig;

export function createWebinyStreamApiHandler(config: CreateWebinyStreamApiHandlerConfig) {
    return createStreamLambdaHandler({
        root: async container => {
            // ── Transport ──────────────────────────────────────────────
            // Registers the Function URL event type + router + the streaming terminal handler.
            // Deliberately NOT alongside ApiGatewayFeature: both event types match the same payload
            // shape, so they must never share a container.
            FunctionUrlStreamFeature.register(container);

            // ── Tenant + auth (extract → shared load) ──────────────────
            // registerDecorator applies LATER registrations as the OUTER wrapper (whose execute() runs
            // first). TENANT must be established before IDENTITY: API-key authentication resolves the
            // key by tenant partition (ApiKeysRepository reads TenantContext.getTenant()), so identity
            // establishment depends on the tenant. The reverse is not true. So register identity first
            // (inner) and tenant last (outer) → tenant runs, then identity, then the router. Mirrors
            // the buffered handler.
            container.registerDecorator(FunctionUrlStreamIdentityLoaderDecorator);
            container.registerDecorator(FunctionUrlStreamTenantLoaderDecorator);

            // ── Background tasks: outbound dispatch only ───────────────
            // Registers StepFunctionService, which is what a `TaskService.trigger()` resolves to
            // actually start an execution. Without it the trigger throws deep inside the container
            // and every caller that ignores the failure just carries on. `BackgroundTaskEventType`
            // is deliberately left out, so the handler this also registers stays unreachable here:
            // Step Functions invokes the buffered function, never this one.
            BackgroundTasksAwsFeature.register(container);

            // Resolved here rather than at factory time: one bundle exports BOTH this handler and the
            // buffered one, so building the client eagerly would open a second DynamoDB client on every
            // cold start of whichever function isn't streaming. `root` runs once, lazily.
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
