import type { APIGatewayProxyEvent } from "@webiny/aws-sdk/types/index.js";
import { EventType } from "@webiny/event-handler-core";
import { ApiGatewayEventHandler } from "../abstractions/handlers/ApiGatewayEventHandler.js";
import type { IEventType } from "@webiny/event-handler-core";

class ApiGatewayEventTypeImpl implements IEventType<APIGatewayProxyEvent> {
    canHandle(event: any): event is APIGatewayProxyEvent {
        // v1 / HTTP API v1 payload format: httpMethod + path
        // requestContext.requestId is present in real API GW invocations but absent in
        // direct CLI-style Lambda invocations, so we only require httpMethod + path.
        if (event?.httpMethod && event?.path) {
            return true;
        }
        // v2 HTTP API payload format: rawPath + requestContext.http.method
        if (
            event?.rawPath &&
            event?.requestContext?.http?.method &&
            event?.requestContext?.requestId
        ) {
            return true;
        }
        return false;
    }

    getHandlerAbstraction() {
        return ApiGatewayEventHandler;
    }
}

export const ApiGatewayEventType = EventType.createImplementation({
    implementation: ApiGatewayEventTypeImpl,
    dependencies: []
});
