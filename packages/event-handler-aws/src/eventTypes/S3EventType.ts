import type { S3Event } from "@webiny/aws-sdk/types/index.js";
import { EventType } from "@webiny/event-handler-core";
import { S3EventHandler } from "../abstractions/handlers/S3EventHandler.js";
import type { IEventType } from "@webiny/event-handler-core";

class S3EventTypeImpl implements IEventType<S3Event> {
    canHandle(event: any): event is S3Event {
        return !!(event?.Records && event.Records[0]?.eventSource === "aws:s3");
    }

    getHandlerAbstraction() {
        return S3EventHandler;
    }
}

export const S3EventType = EventType.createImplementation({
    implementation: S3EventTypeImpl,
    dependencies: []
});
