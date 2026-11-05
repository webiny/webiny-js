import type { Container } from "@webiny/di";
import { EventDispatcher } from "@webiny/event-handler-core";
import { Logger } from "@webiny/api-core/features/logger/index.js";
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
 *
 * Returns a function that stops the timers, for when the process is shutting down.
 */
export function startTaskRecovery(rootContainer: Container): () => void {
    const dispatcher = rootContainer.resolve(EventDispatcher);
    const logger = rootContainer.resolve(Logger);
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
            // A run that failed before the handler, which reports its own results and failures.
            logger.error({ error }, "[background-tasks] recovery failed");
        } finally {
            running = false;
        }
    };

    const firstRun = setTimeout(recover, FIRST_RUN_DELAY_MS);
    const everyMinute = setInterval(recover, RECOVER_EVERY_MS);

    return () => {
        clearTimeout(firstRun);
        clearInterval(everyMinute);
    };
}
