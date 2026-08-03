import { Container } from "@webiny/di";
import { HandlerConfig } from "./HandlerConfig.js";
import { HandlerRuntime, DefaultHandlerRuntime } from "./HandlerRuntime.js";
import { DefaultRootContainerFactory } from "./RootContainerFactory.js";
import { DefaultChildContainerFactory } from "./ChildContainerFactory.js";

/**
 * Wires the DI-native handler app and returns the platform-invocable handler.
 *
 * The handler is itself a small DI app living in an "app container" (distinct from the per-process
 * root container and the per-request child container it goes on to create). `HandlerRuntime` owns
 * the flow; `RootContainerFactory` and `ChildContainerFactory` own container creation. Each is a
 * decoratable abstraction, so transports/composition layers extend the lifecycle without this
 * function growing new branches.
 */
export function createHandler(config: HandlerConfig.Interface) {
    const appContainer = new Container();

    // Register the config as-is — the default lifecycle factories resolve HandlerConfig directly.
    appContainer.registerInstance(HandlerConfig, config);

    // Register the default lifecycle abstractions. Singleton-scoped so the memoized root container
    // (held by RootContainerFactory) is shared across every warm invocation.
    appContainer.register(DefaultRootContainerFactory).inSingletonScope();
    appContainer.register(DefaultChildContainerFactory).inSingletonScope();
    appContainer.register(DefaultHandlerRuntime).inSingletonScope();

    // Seam: let callers decorate the runtime / factories before the app is resolved.
    config.app?.(appContainer);

    const runtime = appContainer.resolve(HandlerRuntime);

    return (...rawArgs: any[]): Promise<any> => runtime.handle(rawArgs);
}
