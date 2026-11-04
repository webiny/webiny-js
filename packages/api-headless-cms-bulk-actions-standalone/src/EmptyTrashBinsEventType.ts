import { EventType } from "@webiny/event-handler-core";
import type { IEventType } from "@webiny/event-handler-core";
import { EmptyTrashBinsEventHandler } from "./EmptyTrashBinsEventHandler.js";

export const EMPTY_TRASH_BINS_EVENT_IDENTIFIER = "WebinyEmptyTrashBins";

/**
 * Asks for the trash bins to be emptied. The standalone server dispatches it on a timer; AWS gets
 * the same from an EventBridge rule (`WebinyEmptyTrashBin`).
 */
export interface IEmptyTrashBinsEvent {
    [EMPTY_TRASH_BINS_EVENT_IDENTIFIER]: true;
}

class EmptyTrashBinsEventTypeImpl implements IEventType<IEmptyTrashBinsEvent> {
    canHandle(event: any): event is IEmptyTrashBinsEvent {
        return event?.[EMPTY_TRASH_BINS_EVENT_IDENTIFIER] === true;
    }

    getHandlerAbstraction() {
        return EmptyTrashBinsEventHandler;
    }
}

export const EmptyTrashBinsEventType = EventType.createImplementation({
    implementation: EmptyTrashBinsEventTypeImpl,
    dependencies: []
});
