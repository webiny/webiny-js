import { createImplementation } from "@webiny/di";
import { EventBridgeEventQualifier } from "../../abstractions/qualifiers/EventBridgeEventQualifier.js";

export class EventBridgeEventQualifierImpl implements EventBridgeEventQualifier.Interface {
    execute(event: any): boolean {
        return !!event.source && !!event["detail-type"] && event.detail !== undefined;
    }
}

export const eventBridgeEventQualifier = createImplementation({
    abstraction: EventBridgeEventQualifier,
    implementation: EventBridgeEventQualifierImpl,
    dependencies: []
});

