import type { SQSEvent } from "@webiny/aws-sdk/types/index.js";
import { EventType } from "@webiny/event-handler";
import { SqsEventHandler } from "../abstractions/functions/SqsEventHandler.js";
import type { IEventType } from "@webiny/event-handler";

class SqsEventTypeImpl implements IEventType<SQSEvent> {
    canHandle(event: any): event is SQSEvent {
        return !!(event?.Records && event.Records[0]?.eventSource === "aws:sqs");
    }

    getHandlerAbstraction() {
        return SqsEventHandler;
    }
}

export const SqsEventType = EventType.createImplementation({
    implementation: SqsEventTypeImpl,
    dependencies: []
});
