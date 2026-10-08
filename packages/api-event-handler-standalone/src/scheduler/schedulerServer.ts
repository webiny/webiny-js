import type { Container } from "@webiny/di";
import { EventDispatcher } from "@webiny/event-handler-core";
import { ScheduledActionEventType } from "@webiny/event-handler-core";
import { SCHEDULED_ACTION_EVENT_IDENTIFIER } from "@webiny/event-handler-core";
import type { IScheduledActionEvent } from "@webiny/event-handler-core";
import { SchedulerService } from "@webiny/api-scheduler/shared/abstractions.js";
import { ScheduledActionLambdaHandler } from "@webiny/api-scheduler";
import { BreeSchedulerService } from "@webiny/api-scheduler-standalone";
import type { Logger } from "@webiny/api-core/features/logger/abstractions.js";
import { SchedulerSingleton } from "./abstractions/SchedulerSingleton.js";
import { ScheduledActionRecoverEventType } from "./ScheduledActionRecoverEventType.js";
import { SCHEDULED_ACTION_RECOVER_EVENT_IDENTIFIER } from "./ScheduledActionRecoverEventType.js";
import type { IScheduledActionRecoverEvent } from "./ScheduledActionRecoverEventType.js";
import { RecoverScheduledActionsHandler } from "./RecoverScheduledActionsHandler.js";
import { ScheduledActionRecoverEventHandler } from "./ScheduledActionRecoverEventHandler.js";

/**
 * Minimal console-backed logger for the root scheduler singleton. The real DI Logger is registered
 * per-request (via ApiCoreFeature/LoggerFeature), so it isn't resolvable here at the root where the
 * singleton is built. And even if we bridged to it, timers fire outside any request — there's no
 * request context for a context-aware logger to enrich — so console is functionally equivalent, not
 * a downgrade. Revisit (a shared boot-time logger for all root singletons) tracked in
 * https://github.com/webiny/webiny-js/issues/5446.
 */
const consoleLogger: Logger.Interface = {
    trace: (...args: any[]) => console.trace(...args),
    debug: (...args: any[]) => console.debug(...args),
    info: (...args: any[]) => console.info(...args),
    warn: (...args: any[]) => console.warn(...args),
    error: (...args: any[]) => console.error(...args),
    fatal: (...args: any[]) => console.error(...args),
    log: (...args: any[]) => console.log(...args)
};

/**
 * ROOT wiring for the standalone (Bree, in-process) scheduler. Unlike AWS (per-request EventBridge
 * binding), the server holds ONE long-lived Bree instance for all tenants, started once at boot —
 * the counterpart of the WebSockets connection manager. Registered as `SchedulerService` so
 * per-request create/update/delete (during GraphQL mutations) manipulate that single live timer set.
 *
 * When a timer fires (outside any request), the singleton dispatches a `ScheduledActionEvent`. The
 * handler is the one AWS runs for an EventBridge Scheduler invocation, in a fresh request container.
 */
export function registerSchedulerServer(rootContainer: Container): void {
    const dispatcher = rootContainer.resolve(EventDispatcher);

    const service = new BreeSchedulerService({
        logger: consoleLogger,
        onTrigger: async (id, namespace, tenant) => {
            /*
             * `scheduleFor` is the time it fired. The event type needs one to recognise the event,
             * and nothing downstream reads it.
             */
            const event: IScheduledActionEvent = {
                [SCHEDULED_ACTION_EVENT_IDENTIFIER]: {
                    id,
                    namespace,
                    tenant,
                    scheduleFor: new Date().toISOString()
                }
            };
            try {
                await dispatcher.dispatch(event);
            } catch (err) {
                console.error(`[scheduler] scheduled action "${id}" failed:`, err);
            }
        }
    });

    // Register the ONE Bree instance under TWO tokens — two views of the same object:
    //
    //   - SchedulerService: the hosting-agnostic contract (create/update/delete/exists) that AWS
    //     implements too. This is what per-request GraphQL mutations resolve to schedule/reschedule.
    //   - SchedulerSingleton: typed as the CONCRETE BreeSchedulerService, so it also exposes the
    //     methods that aren't on that contract — start() and recover(). Those are Bree-only: AWS's
    //     EventBridge is managed infra (nothing to start) and persists its own schedules (nothing to
    //     recover), so they don't belong on the shared interface. The boot step + recover handler
    //     resolve this token precisely because they need start()/recover().
    //
    // registerInstance (not register) because it's a single live object holding all tenants' timers —
    // every caller must get the SAME instance, not a per-scope construction. Registered at root, so
    // per-request child containers inherit it via the parent chain; nothing registers a per-request
    // SchedulerService default that would shadow it (unlike e.g. the WS transport's Null default).
    rootContainer.registerInstance(SchedulerSingleton, service);
    rootContainer.registerInstance(SchedulerService, service);

    rootContainer.register(ScheduledActionEventType);
    rootContainer.register(ScheduledActionLambdaHandler);

    rootContainer.register(ScheduledActionRecoverEventType);
    rootContainer.register(RecoverScheduledActionsHandler);
}

async function recoverPendingSchedules(dispatcher: EventDispatcher.Interface): Promise<void> {
    const event: IScheduledActionRecoverEvent = {
        [SCHEDULED_ACTION_RECOVER_EVENT_IDENTIFIER]: true
    };

    try {
        const result = await dispatcher.dispatch<ScheduledActionRecoverEventHandler.Result>(event);
        console.log(`[scheduler] boot recovery: re-armed ${result.recovered} pending action(s)`);
    } catch (err) {
        console.error("[scheduler] boot recovery failed:", err);
    }
}

/**
 * Boot step (onServer): start the timers, then re-arm the persisted schedules. Recovery runs in the
 * background: it executes overdue actions one by one, and the server should not wait for that
 * before it starts listening. A failure is logged and never crashes startup.
 */
export async function startSchedulerServer(rootContainer: Container): Promise<void> {
    await rootContainer.resolve(SchedulerSingleton).start();

    const dispatcher = rootContainer.resolve(EventDispatcher);
    void recoverPendingSchedules(dispatcher);
}
