import { Abstraction } from "@webiny/di";
import type { Container } from "@webiny/di";

export interface IHandlerPlatform {
    /**
     * Registers the platform's raw invocation arguments (the AWS Lambda event and context, for
     * example) into the handler execution's container, before the execution's own setup runs.
     * The event to dispatch is always `rawArgs[0]`; a platform never changes it.
     */
    bind(container: Container, rawArgs: any[]): void | Promise<void>;
    /**
     * The platform's own id for the invocation (the AWS request id on Lambda), used as the handler
     * execution id so errors and debug captures can be matched against the platform's logs. It is
     * a label only: the stale-execution check compares executions, not ids, so a platform that
     * repeats an id (Lambda retrying an async invocation) is fine. `undefined` when the platform
     * has none, and the handler app generates a UUID.
     */
    getExecutionId(rawArgs: any[]): string | undefined;
}

/**
 * The platform a handler app runs on: what turns one platform invocation into a handler execution.
 * `HandlerApp.init()` registers `NoopHandlerPlatform` in its app container; a handler factory for a
 * specific platform registers its own over it through `config.app` (the last registration wins).
 */
export const HandlerPlatform = new Abstraction<IHandlerPlatform>("HandlerPlatform");

export namespace HandlerPlatform {
    export type Interface = IHandlerPlatform;
}
