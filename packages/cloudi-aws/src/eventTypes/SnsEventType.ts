import type { SNSEvent } from "@webiny/aws-sdk/types/index.js";
import { EventType } from "@webiny/event-handler";
import { SnsEventHandler } from "../abstractions/functions/SnsEventHandler.js";
import type { IEventType } from "@webiny/event-handler";

class SnsEventTypeImpl implements IEventType<SNSEvent> {
    canHandle(event: any): event is SNSEvent {
        return !!(event?.Records && event.Records[0]?.EventSource === "aws:sns");
    }

    getHandlerAbstraction() {
        return SnsEventHandler;
    }
}

export const SnsEventType = EventType.createImplementation({
    implementation: SnsEventTypeImpl,
    dependencies: []
});
