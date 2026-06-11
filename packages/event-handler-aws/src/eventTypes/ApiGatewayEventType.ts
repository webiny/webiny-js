import type { APIGatewayProxyEvent } from "@webiny/aws-sdk/types/index.js";
import { EventType } from "@webiny/event-handler-core";
import { ApiGatewayEventHandler } from "../abstractions/handlers/ApiGatewayEventHandler.js";
import type { IEventType } from "@webiny/event-handler-core";

class ApiGatewayEventTypeImpl implements IEventType<APIGatewayProxyEvent> {
    canHandle(event: any): event is APIGatewayProxyEvent {
        return !!(event?.httpMethod && event?.requestContext?.requestId);
    }

    getHandlerAbstraction() {
        return ApiGatewayEventHandler;
    }
}

export const ApiGatewayEventType = EventType.createImplementation({
    implementation: ApiGatewayEventTypeImpl,
    dependencies: []
});
