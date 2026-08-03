import { Container } from "@webiny/di";
import { EventType } from "./EventType.js";
import { HandlerConfig, RootContainerFactory, ChildContainerFactory } from "./abstractions.js";
import { DefaultRootContainerFactory } from "./RootContainerFactory.js";
import { DefaultChildContainerFactory } from "./ChildContainerFactory.js";
import { executeChain } from "./chain.js";

/**
 * The DI-native handler app. `EventProcessor.init(config)` builds a small "app container" (distinct
 * from the per-process root container and the per-request child container it goes on to create),
 * wires the default lifecycle abstractions, and returns a processor whose `process()` is the
 * platform-invocable handler.
 *
 * The lifecycle is delegated to decoratable DI abstractions — {@link RootContainerFactory} (build
 * the root once) and {@link ChildContainerFactory} (create + set up the per-request child) — so
 * transports/composition layers extend it by decoration (`config.app`) instead of this class
 * growing new branches. `EventProcessor` is distinct from {@link EventHandler}, which is a single
 * handler IN the dispatch chain.
 */
export class EventProcessor {
    private constructor(
        private rootContainerFactory: RootContainerFactory.Interface,
        private childContainerFactory: ChildContainerFactory.Interface
    ) {}

    static init(config: HandlerConfig.Interface): EventProcessor {
        const appContainer = new Container();

        // Register the config as-is — the default lifecycle factories resolve HandlerConfig directly.
        appContainer.registerInstance(HandlerConfig, config);

        // Register the default lifecycle abstractions. Singleton-scoped so the memoized root
        // container (held by RootContainerFactory) is shared across every warm invocation.
        appContainer.register(DefaultRootContainerFactory).inSingletonScope();
        appContainer.register(DefaultChildContainerFactory).inSingletonScope();

        // Seam: let callers decorate the factories before the app is resolved.
        config.app?.(appContainer);

        // Resolve the factories once (decorators applied) so their state — notably the memoized
        // root — is reused across every invocation of process().
        return new EventProcessor(
            appContainer.resolve(RootContainerFactory),
            appContainer.resolve(ChildContainerFactory)
        );
    }

    async process(...rawArgs: any[]): Promise<any> {
        const root = await this.rootContainerFactory.get();
        const child = await this.childContainerFactory.create(root, rawArgs);

        // The event to match on is always the first raw argument (transports never change this).
        const event = rawArgs[0];
        const eventTypes = child.resolveAll(EventType);
        const matched = eventTypes.find(et => et.canHandle(event));

        if (!matched) {
            // Include a non-sensitive shape summary so this is debuggable: which event types were
            // registered vs. what the event actually looks like (keys + EventBridge discriminators).
            const shape =
                event && typeof event === "object"
                    ? {
                          keys: Object.keys(event),
                          source: (event as any).source,
                          detailType: (event as any)["detail-type"]
                      }
                    : { type: typeof event };
            const registered = eventTypes.map(et => (et as any)?.constructor?.name);
            throw new Error(
                `No event type matched the incoming event. Event shape: ${JSON.stringify(
                    shape
                )}; registered event types: ${JSON.stringify(registered)}`
            );
        }

        const abstraction = matched.getHandlerAbstraction();
        const handlers = child.resolveAll(abstraction);

        return executeChain(handlers, event);
    }
}
