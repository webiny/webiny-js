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
}

/**
 * Default transport: binds nothing. Reproduces the plain `createHandler` behavior for callers
 * (e.g. the Node HTTP server) that pass the event straight through with no transport primitives.
 */
export const noopTransport: Transport = {
    bind() {}
};
