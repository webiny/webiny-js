import { EventType } from "@webiny/event-handler-core";
import type { IEventType } from "@webiny/event-handler-core";
import { FunctionUrlStreamEventHandler } from "~/abstractions/handlers/FunctionUrlStreamEventHandler.js";

/**
 * Recognises a Lambda Function URL HTTP invocation (payload format 2.0).
 *
 * The payload is all but identical to API Gateway v2, so this MUST NOT be registered in the same
 * container as `ApiGatewayEventType` — both would match and the first registration would win. That is
 * not a real constraint in practice: response streaming requires its own Lambda function (the handler
 * entry point is fixed per function and a streamified handler is only valid under RESPONSE_STREAM),
 * so the streaming composition root registers this one and never `ApiGatewayFeature`.
 */
class FunctionUrlStreamEventTypeImpl implements IEventType<any> {
    canHandle(event: any): event is any {
        return Boolean(event?.rawPath && event?.requestContext?.http?.method);
    }

    getHandlerAbstraction() {
        return FunctionUrlStreamEventHandler;
    }
}

export const FunctionUrlStreamEventType = EventType.createImplementation({
    implementation: FunctionUrlStreamEventTypeImpl,
    dependencies: []
});
