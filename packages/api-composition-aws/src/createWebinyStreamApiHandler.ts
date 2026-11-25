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
import { createStreamLambdaHandler, FunctionUrlStreamFeature } from "@webiny/api-kernel-aws";
import { BackgroundTasksAwsFeature } from "@webiny/background-tasks-aws";
import { registerWebinyApiChild, registerWebinyApiRoot } from "~/composition/index.js";
import { registerHttpTransport } from "@webiny/api-composition-core";
import type { WebinyApiCompositionConfig } from "~/composition/index.js";

export type CreateWebinyStreamApiHandlerConfig = WebinyApiCompositionConfig;

export function createWebinyStreamApiHandler(config: CreateWebinyStreamApiHandlerConfig) {
    return createStreamLambdaHandler({
        root: async container => {
            // ── Transport ──────────────────────────────────────────────
            // Registers the Function URL event type + router + the streaming terminal handler.
            // Deliberately NOT alongside ApiGatewayFeature: both event types match the same payload
            // shape, so they must never share a container.
            // registerHttpTransport also registers the tenant, identity and preview-as loading.
            registerHttpTransport(container, FunctionUrlStreamFeature);

            // ── Background tasks: outbound dispatch only ───────────────
            // Registers StepFunctionService, which is what a `TaskService.trigger()` resolves to
            // actually start an execution. Without it the trigger throws deep inside the container
            // and every caller that ignores the failure just carries on. `BackgroundTaskInputType`
            // is deliberately left out, so the handler this also registers stays unreachable here:
            // Step Functions invokes the buffered function, never this one.
            BackgroundTasksAwsFeature.register(container);

            await registerWebinyApiRoot(container, config);
        },

        child: async container => {
            await registerWebinyApiChild(container, config);
        }
    });
}
