import { Container } from "@webiny/di";
import { HandlerConfig } from "./HandlerConfig.js";
import { HandlerRuntime, DefaultHandlerRuntime } from "./HandlerRuntime.js";
import { DefaultRootContainerFactory } from "./RootContainerFactory.js";
import { DefaultChildContainerFactory } from "./ChildContainerFactory.js";
import { noopTransport } from "./Transport.js";
import type { Transport } from "./Transport.js";
import type { HandlerSetup } from "./types.js";

export interface CreateHandlerOptions {
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
     * small container holding {@link HandlerRuntime}, {@link RootContainerFactory} and
     * {@link ChildContainerFactory}), so callers can `registerDecorator(...)` around any lifecycle
     * step — e.g. wrapping `ChildContainerFactory` to refresh a license before each request.
     */
    app?: (container: Container) => void;
}

/**
 * Wires the DI-native handler app and returns the platform-invocable handler.
 *
 * The handler is itself a small DI app living in an "app container" (distinct from the per-process
 * root container and the per-request child container it goes on to create). `HandlerRuntime` owns
 * the flow; `RootContainerFactory` and `ChildContainerFactory` own container creation. Each is a
 * decoratable abstraction, so transports/composition layers extend the lifecycle without this
 * function growing new branches.
 */
export function createHandler(options: CreateHandlerOptions) {
    const appContainer = new Container();

    appContainer.registerInstance(HandlerConfig, {
        root: options.root,
        request: options.request,
        transport: options.transport ?? noopTransport,
        rootContainer: options.rootContainer ?? null
    });

    // Register the default lifecycle abstractions. Singleton-scoped so the memoized root container
    // (held by RootContainerFactory) is shared across every warm invocation.
    appContainer.register(DefaultRootContainerFactory).inSingletonScope();
    appContainer.register(DefaultChildContainerFactory).inSingletonScope();
    appContainer.register(DefaultHandlerRuntime).inSingletonScope();

    // Seam: let callers decorate the runtime / factories before the app is resolved.
    options.app?.(appContainer);

    const runtime = appContainer.resolve(HandlerRuntime);

    return (...rawArgs: any[]): Promise<any> => runtime.handle(rawArgs);
}
