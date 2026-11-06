import type { Container } from "@webiny/di";

/**
 * A Transport owns the single transport-specific step of the handler loop: the "bind".
 *
 * Given the raw arguments the platform invoked the handler with, it binds any transport
 * primitives into the per-request container (side-effect only) so downstream translators and
 * handlers can resolve them. Everything else in the loop — request setup, initializers, event-type
 * matching, dispatch — is transport-agnostic and lives in {@link createHandler}.
 *
 * The event to match on is always `rawArgs[0]`; a Transport never changes the match target.
 */
export interface Transport {
    bind(container: Container, ...rawArgs: any[]): void | Promise<void>;
    /**
     * The platform's own id for this invocation, used as the handler execution id so errors and
     * debug captures can be matched against the platform's logs (the AWS request id on Lambda).
     * It is a label only: the stale-execution check compares executions, not ids, so a platform
     * that repeats an id (Lambda retrying an async invocation) is fine. Without one, the handler
     * app generates a UUID.
     */
    getExecutionId?(...rawArgs: any[]): string | undefined;
}

/**
 * Default transport: binds nothing. Reproduces the plain `createHandler` behavior for callers
 * (e.g. the Node HTTP server) that pass the event straight through with no transport primitives.
 */
export const noopTransport: Transport = {
    bind() {}
};
