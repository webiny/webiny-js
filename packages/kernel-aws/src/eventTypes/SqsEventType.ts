import type { SQSEvent } from "@webiny/aws-sdk/types/index.js";
import { EventType } from "@webiny/kernel-core";
import { SqsEventHandler } from "../abstractions/handlers/SqsEventHandler.js";
import type { IEventType } from "@webiny/kernel-core";

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
