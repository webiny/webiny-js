import type { EventBridgeEvent } from "@webiny/aws-sdk/types/index.js";
import { InputType } from "@webiny/api-kernel-core";
import { EventBridgeInputHandler } from "../abstractions/handlers/EventBridgeInputHandler.js";

class EventBridgeInputTypeImpl implements InputType.Interface<EventBridgeEvent<string, any>> {
    matches(input: any): input is EventBridgeEvent<string, any> {
        return !!(input?.source && input?.["detail-type"] && input?.detail);
    }

    getHandlerAbstraction() {
        return EventBridgeInputHandler;
    }
}

export const EventBridgeInputType = InputType.createImplementation({
    implementation: EventBridgeInputTypeImpl,
    dependencies: []
});
