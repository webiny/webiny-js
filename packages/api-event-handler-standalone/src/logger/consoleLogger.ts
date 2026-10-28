import type { Logger } from "@webiny/api-core/features/logger/abstractions.js";

/*
 * Minimal console-backed logger for root singletons: the scheduler and the websocket message bus.
 * The real DI Logger is registered per-request (via ApiCoreFeature/LoggerFeature), so it isn't
 * resolvable at the root where these singletons are built. And even if we bridged to it, they run
 * outside any request, so there's no request context for a context-aware logger to enrich, and
 * console is functionally equivalent, not a downgrade. Revisit (a shared boot-time logger for all root singletons) tracked in
 * https://github.com/webiny/webiny-js/issues/5446.
 */
export const consoleLogger: Logger.Interface = {
    trace: (...args: any[]) => console.trace(...args),
    debug: (...args: any[]) => console.debug(...args),
    info: (...args: any[]) => console.info(...args),
    warn: (...args: any[]) => console.warn(...args),
    error: (...args: any[]) => console.error(...args),
    fatal: (...args: any[]) => console.error(...args),
    log: (...args: any[]) => console.log(...args)
};
