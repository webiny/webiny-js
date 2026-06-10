import { Container } from "@webiny/di";
import { EventType } from "~/features/events/EventType.js";
import { RequestContainer } from "~/features/events/RequestContainer.js";
import { executeChain } from "~/features/events/chain.js";
import type { HandlerSetup } from "~/features/events/types.js";

export interface CreateHandlerOptions {
    root: HandlerSetup;
    request?: HandlerSetup;
}

export function createHandler(options: CreateHandlerOptions) {
    let rootContainer: Container | null = null;

    return async (event: any): Promise<any> => {
        if (!rootContainer) {
            rootContainer = new Container();
            await options.root(rootContainer);
        }

        const child = rootContainer.createChildContainer();
        child.registerInstance(RequestContainer, child);

        if (options.request) {
            await options.request(child);
        }

        const eventTypes = child.resolveAll(EventType);
        const matched = eventTypes.find(et => et.canHandle(event));

        if (!matched) {
            throw new Error("No event type matched the incoming event");
        }

        const abstraction = matched.getHandlerAbstraction();
        const handlers = child.resolveAll(abstraction);

        return executeChain(handlers, event);
    };
}
