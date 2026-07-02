import { Container } from "@webiny/di";
import {
    EventType,
    executeChain,
    RequestContainer,
    RequestInitializer
} from "@webiny/event-handler-core";
import type { HandlerSetup } from "@webiny/event-handler-core";
import { AwsLambdaEvent } from "./abstractions/AwsLambdaEvent.js";
import { AwsLambdaContext } from "./abstractions/AwsLambdaContext.js";
import type { Context } from "@webiny/aws-sdk/types/index.js";

export interface CreateLambdaHandlerOptions {
    root: HandlerSetup;
    request?: HandlerSetup;
}

export function createLambdaHandler(options: CreateLambdaHandlerOptions) {
    let rootContainer: Container | null = null;

    return async (event: any, context?: Context): Promise<any> => {
        if (!rootContainer) {
            rootContainer = new Container();
            await options.root(rootContainer);
        }

        const child = rootContainer.createChildContainer();
        child.registerInstance(RequestContainer, child);

        child.registerInstance(AwsLambdaEvent, event);
        if (context) {
            child.registerInstance(AwsLambdaContext, context);
        }

        if (options.request) {
            await options.request(child);
        }

        // Per-request async initialization (tenant-agnostic), before the event is dispatched and
        // before auth/tenant are established (e.g. the WCP license refresh). Mirrors createHandler
        // in @webiny/event-handler-core. For tenant-dependent setup use lazy DI factories.
        for (const initializer of child.resolveAll(RequestInitializer)) {
            await initializer.init();
        }

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
