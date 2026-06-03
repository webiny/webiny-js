import { Container } from "@webiny/di";
import { CloudHandler, executeChain } from "@cloudi/core";
import type { HandlerSetup } from "@cloudi/core";
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

        const handlers = child.resolveAll(CloudHandler);
        return executeChain(handlers, event);
    };
}
