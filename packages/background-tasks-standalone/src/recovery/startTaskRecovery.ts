import type { Container } from "@webiny/di";
import { EventDispatcher } from "@webiny/event-handler-core";
import { RECOVER_EVERY_MS } from "~/claim/constants.js";
import { TASK_RECOVER_EVENT_IDENTIFIER } from "./TaskRecoverEventType.js";
import type { ITaskRecoverEvent } from "./TaskRecoverEventType.js";
import type { TaskRecoverEventHandler } from "./TaskRecoverEventHandler.js";

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
            const result = await dispatcher.dispatch<TaskRecoverEventHandler.Result>(event);
            if (result.resumed > 0 || result.failed > 0) {
                console.log(
                    `[background-tasks] recovery: resumed ${result.resumed}, failed ${result.failed}`
                );
            }
            if (result.failedTenants.length > 0) {
                const tenants = result.failedTenants.join(", ");
                console.error(`[background-tasks] recovery failed for tenant(s): ${tenants}`);
            }
        } catch (error) {
            console.error("[background-tasks] recovery failed:", error);
        } finally {
            running = false;
        }
    };

    setTimeout(recover, FIRST_RUN_DELAY_MS);
    setInterval(recover, RECOVER_EVERY_MS);
}
