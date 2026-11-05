import { Container } from "@webiny/di";
import { HandlerConfig } from "./abstractions.js";
import { RootContainerFactory } from "./abstractions.js";
import { HandlerExecutionRunner } from "./abstractions.js";
import { DefaultRootContainerFactory } from "./RootContainerFactory.js";
import { DefaultChildContainerFactory } from "./ChildContainerFactory.js";
import { DefaultHandlerExecutionScope } from "./DefaultHandlerExecutionScope.js";
import { DefaultHandlerExecutionRunner } from "./HandlerExecutionRunner.js";
import { NoopHandlerPlatform } from "./NoopHandlerPlatform.js";

/**
 * The DI-native handler app. `HandlerApp.init(config)` builds a small "app container" (distinct
 * from the per-process root container and the per-request child container it goes on to create),
 * wires the default lifecycle abstractions, and returns an app whose `handle()` is the
 * platform-invocable handler.
 *
 * The lifecycle is delegated to decoratable DI abstractions — {@link HandlerExecutionRunner} (run
 * one execution), {@link RootContainerFactory} (build the root once) and
 * {@link ChildContainerFactory} (create + set up the per-request child) — and to the
 * {@link HandlerPlatform} it runs on (`config.platform`), so platforms and composition layers extend
 * it by configuration and decoration (`config.app`) instead of this class
 * growing new branches. `HandlerApp` is distinct from {@link EventHandler}, which is a single
 * handler IN the dispatch chain.
 */
export class HandlerApp {
    /*
     * `HandlerApp` builds the app container and is the only code that holds it, so it resolves the
     * lifecycle services from it when it needs them. They are singletons there, so every call gets
     * the same instance, and the root container is still built once.
     */
    private constructor(private appContainer: Container) {}

    static init(config: HandlerConfig.Interface): HandlerApp {
        const appContainer = new Container();

        // Register the config as-is — the default lifecycle factories resolve HandlerConfig directly.
        appContainer.registerInstance(HandlerConfig, config);

        // Register the default lifecycle abstractions. Singleton-scoped so the memoized root
        // container (held by RootContainerFactory) is shared across every warm invocation.
        appContainer.register(DefaultRootContainerFactory).inSingletonScope();
        appContainer.register(DefaultChildContainerFactory).inSingletonScope();
        /*
         * One for the whole app, shared by every execution: it is what tells a service which
         * execution is running now.
         */
        appContainer.register(DefaultHandlerExecutionScope).inSingletonScope();
        appContainer.register(DefaultHandlerExecutionRunner).inSingletonScope();
        appContainer.register(config.platform ?? NoopHandlerPlatform).inSingletonScope();

        // Seam: let callers decorate the factories before the app is resolved.
        config.app?.(appContainer);

        return new HandlerApp(appContainer);
    }

    /**
     * Build (once) and return the root container. Lets a caller that needs the root before the
     * first request — e.g. the Node server attaching a WebSockets upgrade handler at startup — get
     * it eagerly. The same memoized root is then reused by every `handle()` call.
     */
    getRootContainer(): Promise<Container> {
        const rootContainerFactory = this.appContainer.resolve(RootContainerFactory);
        return rootContainerFactory.get();
    }

    async handle(...rawArgs: any[]): Promise<any> {
        const runner = this.appContainer.resolve(HandlerExecutionRunner);
        return runner.execute(rawArgs);
    }
}
