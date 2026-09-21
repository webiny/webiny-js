import { createFeature } from "@webiny/feature/api";
import type { Container } from "@webiny/di";
import { HttpFeature } from "@webiny/event-handler-core";
import { FunctionUrlStreamEventType } from "~/eventTypes/FunctionUrlStreamEventType.js";
import { FunctionUrlStreamRouterHandler } from "~/handlers/FunctionUrlStreamRouterHandler.js";

/**
 * Registers the transport-only Lambda Function URL response-streaming infrastructure:
 * - FunctionUrlStreamEventType (recognises a Function URL HTTP invocation)
 * - HttpFeature (HttpRouter + SecureHeadersDecorator)
 * - FunctionUrlStreamRouterHandler (terminal: routes via HttpRouter, writes to the response stream)
 *
 * Must NOT be combined with `ApiGatewayFeature` in the same container — the two event types match the
 * same payload shape. Streaming needs its own Lambda function anyway, so the two live in separate
 * composition roots.
 *
 * Auth/tenant establishment is NOT here; it lives in the composition layer
 * (@webiny/api-event-handler-aws), same split as `ApiGatewayFeature`.
 */
export const FunctionUrlStreamFeature = createFeature({
    name: "FunctionUrlStream",
    register(container: Container) {
        container.register(FunctionUrlStreamEventType);
        HttpFeature.register(container);
        container.register(FunctionUrlStreamRouterHandler);
    }
});
