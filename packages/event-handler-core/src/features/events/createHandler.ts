import { Container } from "@webiny/di";
import { EventType } from "~/features/events/EventType.js";
import { RequestContainer } from "~/features/events/RequestContainer.js";
import { RequestInitializer } from "~/features/events/RequestInitializer.js";
import { executeChain } from "~/features/events/chain.js";
import { noopTransport } from "~/features/events/Transport.js";
import type { Transport } from "~/features/events/Transport.js";
import type { HandlerSetup } from "~/features/events/types.js";

export interface CreateHandlerOptions {
    root: HandlerSetup;
    request?: HandlerSetup;
    /**
     * Transport-specific extract step: binds the raw platform arguments (e.g. the AWS Lambda
     * event + context) into the per-request container. Defaults to a no-op, which leaves the
     * event to pass straight through — the plain server/HTTP behavior.
     */
    transport?: Transport;
}

export function createHandler(options: CreateHandlerOptions) {
    let rootContainer: Container | null = null;
    const transport = options.transport ?? noopTransport;

    return async (...rawArgs: any[]): Promise<any> => {
        if (!rootContainer) {
            rootContainer = new Container();
            await options.root(rootContainer);
        }

        const child = rootContainer.createChildContainer();
        child.registerInstance(RequestContainer, child);

        // Transport-specific extract: bind the raw platform arguments into the request container
        // before request setup runs. The default transport binds nothing.
        await transport.extract(child, ...rawArgs);

        if (options.request) {
            await options.request(child);
        }

        // Per-request async initialization (tenant-agnostic), before the event is dispatched and
        // before auth/tenant are established. For tenant-dependent setup use lazy DI factories.
        for (const initializer of child.resolveAll(RequestInitializer)) {
            await initializer.init();
        }

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
    };
}
