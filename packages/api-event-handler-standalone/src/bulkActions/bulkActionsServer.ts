import type { Container } from "@webiny/di";
import { EventDispatcher } from "@webiny/event-handler-core";
import { EMPTY_TRASH_BINS_EVENT_IDENTIFIER } from "@webiny/api-headless-cms-bulk-actions-standalone";
import type { IEmptyTrashBinsEvent } from "@webiny/api-headless-cms-bulk-actions-standalone";

// Every 6 hours.
const EMPTY_TRASH_INTERVAL_MS = 6 * 60 * 60 * 1000;

// Shortly after boot, so the first run doesn't compete with startup.
const FIRST_RUN_DELAY_MS = 5000;

/**
 * Empties the trash bins on a timer by dispatching an `EmptyTrashBinsEvent`. The standalone
 * counterpart of the EventBridge rule that does it on AWS.
 */
export function startBulkActionsServer(rootContainer: Container): void {
    const dispatcher = rootContainer.resolve(EventDispatcher);
    const event: IEmptyTrashBinsEvent = { [EMPTY_TRASH_BINS_EVENT_IDENTIFIER]: true };

    const trigger = async () => {
        try {
            await dispatcher.dispatch(event);
        } catch (err) {
            console.error("[bulk-actions] failed to start emptying the trash bins:", err);
        }
    };

    setTimeout(trigger, FIRST_RUN_DELAY_MS);
    setInterval(trigger, EMPTY_TRASH_INTERVAL_MS);
}
