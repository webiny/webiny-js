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
    /** Set up the ROOT container (once per process). */
    root: HandlerSetup;
    /** Set up the per-request CHILD container. */
    child?: HandlerSetup;
    /**
     * Transport-specific extract step: binds the raw platform arguments (e.g. the AWS Lambda
     * event + context) into the per-request container. Defaults to a no-op, which leaves the
     * event to pass straight through — the plain server/HTTP behavior.
     */
    transport?: Transport;
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
 * wrap it to run process-lifetime setup around the root build. `get()` is idempotent — the root is
 * built (and `config.root` run) on the first call and the same instance is returned thereafter, so a
 * transport can call it eagerly (see `HandlerApp.getRootContainer`) without rebuilding.
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
 * primitives, and runs request setup.
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
