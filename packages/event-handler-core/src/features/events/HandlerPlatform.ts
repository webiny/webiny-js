import { Abstraction } from "@webiny/di";
import type { Container } from "@webiny/di";

/**
 * `TArgs` is the platform's invocation shape, the arguments the platform calls the handler with (for
 * Lambda, `[event, context]`). Declaring it as a named tuple keeps the argument order in one type
 * that the platform and its handler factory both use.
 */
export interface IHandlerPlatform<TArgs extends any[] = any[]> {
    /**
     * Registers the platform's raw invocation arguments (the AWS Lambda event and context, for
     * example) into the handler execution's container, before the execution's own setup runs.
     * The event to dispatch is always `rawArgs[0]`; a platform never changes it.
     */
    bind(container: Container, rawArgs: TArgs): void | Promise<void>;
    /**
     * The platform's own id for the invocation (the AWS request id on Lambda), used as the handler
     * execution id so errors and debug captures can be matched against the platform's logs. It is
     * a label only: the stale-execution check compares executions, not ids, so a platform that
     * repeats an id (Lambda retrying an async invocation) is fine. `undefined` when the platform
     * has none, and the handler app generates a UUID.
     */
    getExecutionId(rawArgs: TArgs): string | undefined;
}

/**
 * The platform a handler app runs on: what turns one platform invocation into a handler execution.
 * `HandlerApp.init()` registers the implementation given as `config.platform` in its app container,
 * or `NoopHandlerPlatform` when there is none.
 */
export const HandlerPlatform = new Abstraction<IHandlerPlatform>("HandlerPlatform");

export namespace HandlerPlatform {
    export type Interface<TArgs extends any[] = any[]> = IHandlerPlatform<TArgs>;
}
