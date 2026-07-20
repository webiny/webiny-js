import type { Container } from "@webiny/di";
import { mdbid } from "@webiny/utils";
import { SchedulerService } from "@webiny/api-scheduler/shared/abstractions.js";
import { BreeSchedulerService } from "@webiny/api-scheduler-server";
import type { Logger } from "@webiny/api-core/features/logger/abstractions.js";
import { SchedulerInternalToken } from "./abstractions/InternalToken.js";
import { SchedulerSingleton } from "./abstractions/SchedulerSingleton.js";
import { ScheduledActionRunRoute } from "./ScheduledActionRunRoute.js";
import { ScheduledActionRecoverRoute } from "./ScheduledActionRecoverRoute.js";

const SCHEDULER_HEADER = "x-webiny-scheduler-token";

/** Minimal console-backed logger for the root scheduler singleton (the per-request Logger isn't available at root). */
const consoleLogger: Logger.Interface = {
    trace: (...args: any[]) => console.trace(...args),
    debug: (...args: any[]) => console.debug(...args),
    info: (...args: any[]) => console.info(...args),
    warn: (...args: any[]) => console.warn(...args),
    error: (...args: any[]) => console.error(...args),
    fatal: (...args: any[]) => console.error(...args),
    log: (...args: any[]) => console.log(...args)
};

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
export function registerSchedulerServer(container: Container): void {
    const token = mdbid();
    container.registerInstance(SchedulerInternalToken, { value: token });

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

    // Register the one instance under both the concrete class (for the recover route) and the
    // SchedulerService abstraction (for per-request create/update/delete). Root registration is visible
    // to request containers via the parent chain, and nothing registers a per-request default to shadow it.
    container.registerInstance(SchedulerSingleton, service);
    container.registerInstance(SchedulerService, service);

    container.register(ScheduledActionRunRoute);
    container.register(ScheduledActionRecoverRoute);
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
