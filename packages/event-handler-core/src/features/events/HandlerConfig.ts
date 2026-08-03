import { Abstraction, Container } from "@webiny/di";
import type { Transport } from "./Transport.js";
import type { HandlerSetup } from "./types.js";

/**
 * Internal plumbing: the `createHandler` options, exposed as a DI value so the default
 * {@link RootContainerFactory} / {@link ChildContainerFactory} implementations can resolve them
 * (and stay decoratable). Not part of the public handler API — callers configure via
 * `createHandler` options, not by resolving this.
 */
export interface IHandlerConfig {
    root: HandlerSetup;
    request?: HandlerSetup;
    transport: Transport;
    /**
     * A pre-built, already root-initialized container. When set, the root is NOT built again — the
     * Node server uses this to build the root eagerly at startup (WebSockets upgrade wiring).
     */
    rootContainer: Container | null;
}

export const HandlerConfig = new Abstraction<IHandlerConfig>("HandlerConfig");

export namespace HandlerConfig {
    export type Interface = IHandlerConfig;
}
