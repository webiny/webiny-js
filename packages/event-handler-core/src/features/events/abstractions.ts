import { Abstraction, Container } from "@webiny/di";
import type { Transport } from "./Transport.js";
import type { HandlerSetup } from "./types.js";

/**
 * Configuration for `HandlerApp.init` — and the DI value the default lifecycle abstractions
 * ({@link RootContainerFactory} / {@link ChildContainerFactory}) resolve. The object passed to
 * `init` is registered as-is under this abstraction (no remapping), so the config the caller writes
 * is exactly the config the factories read.
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
     * small container holding the lifecycle abstractions), so callers can `registerDecorator(...)`
     * around any lifecycle step — e.g. wrapping `ChildContainerFactory` to refresh a license before
     * each request.
     */
    app?: (container: Container) => void;
}

export const HandlerConfig = new Abstraction<IHandlerConfig>("HandlerConfig");

export namespace HandlerConfig {
    export type Interface = IHandlerConfig;
}

/**
 * Builds the ROOT container once per process and reuses it across warm invocations. Decoratable —
 * wrap it to run process-lifetime setup around the root build.
 *
 * When {@link HandlerConfig.rootContainer} is supplied (the Node server builds the root eagerly at
 * startup), that container is returned as-is and `config.root` is NOT called again.
 */
export interface IRootContainerFactory {
    get(): Promise<Container>;
}

export const RootContainerFactory = new Abstraction<IRootContainerFactory>("RootContainerFactory");

export namespace RootContainerFactory {
    export type Interface = IRootContainerFactory;
}

/**
 * Creates and sets up the per-request (child) container: spawns the child, binds transport
 * primitives, runs request setup, and runs the pre-dispatch {@link RequestInitializer} loop.
 *
 * Decoratable — this is the seam for per-request work that must run BEFORE the register/dispatch
 * flow (e.g. refreshing a project-level license so register-time checks see it). Since such work
 * typically needs only root-scoped state, a decorator can act before delegating to `create()`.
 */
export interface IChildContainerFactory {
    create(root: Container, rawArgs: any[]): Promise<Container>;
}

export const ChildContainerFactory = new Abstraction<IChildContainerFactory>(
    "ChildContainerFactory"
);

export namespace ChildContainerFactory {
    export type Interface = IChildContainerFactory;
}
