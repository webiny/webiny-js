import type { LambdaFunctionURLEvent } from "@webiny/aws-sdk/types/index.js";
import { EventType, EventHandler } from "@webiny/event-handler-core";
import type { IEventType } from "@webiny/event-handler-core";

class FunctionUrlEventTypeImpl implements IEventType<LambdaFunctionURLEvent> {
    canHandle(event: any): event is LambdaFunctionURLEvent {
        return !!(
            event?.rawPath &&
            event?.requestContext?.http?.method &&
            event?.requestContext?.apiId
        );
    }

    getHandlerAbstraction() {
        return EventHandler;
    }
}

export const FunctionUrlEventType = EventType.createImplementation({
    implementation: FunctionUrlEventTypeImpl,
    dependencies: []
});
