import { Abstraction } from "@webiny/di";
import { EventType } from "./EventType.js";
import { RootContainerFactory } from "./RootContainerFactory.js";
import { ChildContainerFactory } from "./ChildContainerFactory.js";
import { executeChain } from "./chain.js";

/**
 * The DI-native handler app: the top-level orchestrator returned (indirectly) by `createHandler`.
 * It owns the whole per-invocation flow — obtain the root container, create the per-request child,
 * match the incoming event to its {@link EventType}, and dispatch through the handler chain.
 *
 * Decoratable (distinct from {@link EventHandler}, which is a single handler IN the dispatch chain).
 * The root and child container steps are delegated to the {@link RootContainerFactory} /
 * {@link ChildContainerFactory} abstractions so each is independently decoratable.
 */
export interface IHandlerRuntime {
    handle(rawArgs: any[]): Promise<any>;
}

export const HandlerRuntime = new Abstraction<IHandlerRuntime>("HandlerRuntime");

export namespace HandlerRuntime {
    export type Interface = IHandlerRuntime;
}

class HandlerRuntimeImpl implements IHandlerRuntime {
    constructor(
        private rootContainerFactory: RootContainerFactory.Interface,
        private childContainerFactory: ChildContainerFactory.Interface
    ) {}

    async handle(rawArgs: any[]): Promise<any> {
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

export const DefaultHandlerRuntime = HandlerRuntime.createImplementation({
    implementation: HandlerRuntimeImpl,
    dependencies: [RootContainerFactory, ChildContainerFactory]
});
