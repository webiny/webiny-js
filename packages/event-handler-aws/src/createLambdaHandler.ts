import { Container } from "@webiny/di";
import { EventType, executeChain } from "@webiny/event-handler-core";
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

        child.registerInstance(AwsLambdaEvent, event);
        if (context) {
            child.registerInstance(AwsLambdaContext, context);
        }

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
