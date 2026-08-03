import { Abstraction, Container } from "@webiny/di";
import type { Transport } from "./Transport.js";
import type { HandlerSetup } from "./types.js";

/**
 * Configuration for `createHandler` — and the DI value the default lifecycle abstractions
 * ({@link RootContainerFactory} / {@link ChildContainerFactory}) resolve. The object passed to
 * `createHandler` is registered as-is under this abstraction (no remapping), so the config the
 * caller writes is exactly the config the factories read.
 */
export interface IHandlerConfig {
    root: HandlerSetup;
    request?: HandlerSetup;
    /**
     * Transport-specific extract step: binds the raw platform arguments (e.g. the AWS Lambda
     * event + context) into the per-request container. Defaults to a no-op, which leaves the
     * event to pass straight through — the plain server/HTTP behavior.
     */
    transport?: Transport;
    /**
     * A pre-built, already root-initialized container. When provided, `root` is NOT called again —
     * used by transports that must build the root eagerly at startup (e.g. the Node server, which
     * needs the root container ready to attach a WebSockets upgrade handler before the first request).
     */
    rootContainer?: Container;
    /**
     * Decorate the DI-native handler app before its first use. Runs against the APP container (the
     * small container holding {@link EventDispatcher}, {@link RootContainerFactory} and
     * {@link ChildContainerFactory}), so callers can `registerDecorator(...)` around any lifecycle
     * step — e.g. wrapping `ChildContainerFactory` to refresh a license before each request.
     */
    app?: (container: Container) => void;
}

export const HandlerConfig = new Abstraction<IHandlerConfig>("HandlerConfig");

export namespace HandlerConfig {
    export type Interface = IHandlerConfig;
}
