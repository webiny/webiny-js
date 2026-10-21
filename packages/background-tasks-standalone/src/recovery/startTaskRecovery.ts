import type { Container } from "@webiny/di";
import { EventDispatcher } from "@webiny/event-handler-core";
import { RECOVER_EVERY_MS } from "~/claim/constants.js";
import { TASK_RECOVER_EVENT_IDENTIFIER } from "./TaskRecoverEventType.js";
import type { ITaskRecoverEvent } from "./TaskRecoverEventType.js";

// Shortly after boot, so the first run does not compete with startup.
const FIRST_RUN_DELAY_MS = 5000;

/**
 * Looks for tasks nobody holds shortly after boot, then every minute. The first run picks up what a
 * restart or redeploy left behind; the later ones pick up the tasks of another process that died
 * while this one kept running.
 *
 * Runs never overlap: one that finds many tasks can take longer than the interval.
 */
export function startTaskRecovery(rootContainer: Container): void {
    const dispatcher = rootContainer.resolve(EventDispatcher);
    const event: ITaskRecoverEvent = { [TASK_RECOVER_EVENT_IDENTIFIER]: true };
    let running = false;

    const recover = async () => {
        if (running) {
            return;
        }
        running = true;
        try {
            await dispatcher.dispatch(event);
        } catch (error) {
            /*
             * The handler reports what it recovered and what failed through the Logger. This only
             * catches a run that failed before reaching it, where there is no Logger yet: it is
             * registered per request, not in the root container this runs from.
             */
            console.error("[background-tasks] recovery failed:", error);
        } finally {
            running = false;
        }
    };

    setTimeout(recover, FIRST_RUN_DELAY_MS);
    setInterval(recover, RECOVER_EVERY_MS);
}
