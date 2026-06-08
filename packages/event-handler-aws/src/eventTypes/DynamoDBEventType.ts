import type { DynamoDBStreamEvent } from "@webiny/aws-sdk/types/index.js";
import { EventType } from "@webiny/event-handler";
import { DynamoDBEventHandler } from "../abstractions/functions/DynamoDBEventHandler.js";
import type { IEventType } from "@webiny/event-handler";

class DynamoDBEventTypeImpl implements IEventType<DynamoDBStreamEvent> {
    canHandle(event: any): event is DynamoDBStreamEvent {
        return !!(event?.Records && event.Records[0]?.eventSource === "aws:dynamodb");
    }

    getHandlerAbstraction() {
        return DynamoDBEventHandler;
    }
}

export const DynamoDBEventType = EventType.createImplementation({
    implementation: DynamoDBEventTypeImpl,
    dependencies: []
});
