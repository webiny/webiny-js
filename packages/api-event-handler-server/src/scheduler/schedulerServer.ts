import type { Container } from "@webiny/di";
import { uuid } from "@webiny/stdlib";
import { SchedulerService } from "@webiny/api-scheduler/shared/abstractions.js";
import { BreeSchedulerService } from "@webiny/api-scheduler-server";
import type { Logger } from "@webiny/api-core/features/logger/abstractions.js";
import { SchedulerInternalToken } from "./abstractions/InternalToken.js";
import { SchedulerSingleton } from "./abstractions/SchedulerSingleton.js";
import { ScheduledActionRunRoute } from "./ScheduledActionRunRoute.js";
import { ScheduledActionRecoverRoute } from "./ScheduledActionRecoverRoute.js";

const SCHEDULER_HEADER = "x-webiny-scheduler-token";

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

// Self-callback base. process.env.PORT is the resolved listening port injected by runApiServer;
// the 3002 fallback matches findFreePort's search base (and the background-tasks default) so every
// self-callback agrees, though in practice PORT is always set. A shared helper + fail-loud handling
// is tracked in https://github.com/webiny/webiny-js/issues/5448.
const serverBase = () => `http://localhost:${process.env.PORT || "3002"}`;

/**
 * ROOT wiring for the self-hosted (Bree, in-process) scheduler. Unlike AWS (per-request EventBridge
 * binding), the server holds ONE long-lived Bree instance for all tenants, started once at boot — the
 * counterpart of the WebSockets connection manager. Registered as `SchedulerService` so per-request
 * create/update/delete (during GraphQL mutations) manipulate that single live timer set.
 *
 * When a timer fires (outside any request), the singleton POSTs to `/scheduled-action-run`, which
 * rebuilds the request context for the action's tenant and executes it (see the route).
 */
export function registerSchedulerServer(rootContainer: Container): void {
    const token = uuid();
    rootContainer.registerInstance(SchedulerInternalToken, { value: token });

    const service = new BreeSchedulerService({
        logger: consoleLogger,
        onTrigger: async (id, namespace, tenant) => {
            console.log(
                `[scheduler] timer fired for "${id}" (namespace=${namespace}, tenant=${tenant}); calling run route`
            );
            try {
                const res = await fetch(`${serverBase()}/scheduled-action-run`, {
                    method: "POST",
                    headers: { "content-type": "application/json", [SCHEDULER_HEADER]: token },
                    body: JSON.stringify({ id, namespace, tenant })
                });
                // fetch only throws on network errors; a 403 or 500 comes back as a normal non-ok
                // response, so we check for that explicitly — otherwise a failed run would be silent.
                if (!res.ok) {
                    const body = await res.text().catch(() => "");
                    console.error(
                        `[scheduler] run route returned HTTP ${res.status} for "${id}": ${body}`
                    );
                }
            } catch (err) {
                const message = err instanceof Error ? err.message : String(err);
                console.error(
                    `Scheduler trigger for "${id}" failed to reach the run route: ${message}`
                );
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
    //     recover), so they don't belong on the shared interface. The boot step + recover route resolve
    //     this token precisely because they need start()/recover().
    //
    // registerInstance (not register) because it's a single live object holding all tenants' timers —
    // every caller must get the SAME instance, not a per-scope construction. Registered at root, so
    // per-request child containers inherit it via the parent chain; nothing registers a per-request
    // SchedulerService default that would shadow it (unlike e.g. the WS transport's Null default).
    rootContainer.registerInstance(SchedulerSingleton, service);
    rootContainer.registerInstance(SchedulerService, service);

    rootContainer.register(ScheduledActionRunRoute);
    rootContainer.register(ScheduledActionRecoverRoute);
}

/**
 * Boot step (onServer): start the timers, then re-arm persisted schedules by POSTing the recover route
 * (root tenant).
 *
 * `onServer` runs BEFORE the HTTP server starts listening, so the recover POST (which hits this same
 * server) is DEFERRED to the next tick — by then `createServerHandler` has returned and the runner has
 * called `.listen()`. Fire-and-forget: a recovery failure must never block or crash startup.
 */
export async function startSchedulerServer(rootContainer: Container): Promise<void> {
    await rootContainer.resolve(SchedulerSingleton).start();

    const token = rootContainer.resolve(SchedulerInternalToken).value;

    // Deferred: give the runner a moment to bind the listener before we call back into it.
    console.log(`[scheduler] boot: re-arming persisted schedules via ${serverBase()} ...`);
    setTimeout(async () => {
        try {
            const res = await fetch(`${serverBase()}/scheduled-action-recover`, {
                method: "POST",
                headers: { "content-type": "application/json", [SCHEDULER_HEADER]: token },
                body: JSON.stringify({})
            });
            const body = await res.json().catch(() => ({}) as Record<string, unknown>);
            // fetch only throws on network errors; a 403 or 500 comes back as a normal non-ok
            // response, so we check for it here (a token-mismatch 403 used to fail silently).
            if (!res.ok) {
                console.error(`[scheduler] boot recovery failed: HTTP ${res.status}`, body);
                return;
            }
            console.log(
                `[scheduler] boot recovery: re-armed ${body.recovered ?? "?"} pending action(s)`
            );
        } catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            console.error(
                `[scheduler] boot recovery failed to reach the recover route: ${message}`
            );
        }
    }, 1000);
}
