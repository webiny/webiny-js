import { Container } from "@webiny/di";
import { CloudHandler } from "./abstractions/CloudHandler.js";
import { executeChain } from "./chain.js";
import type { HandlerSetup } from "./types.js";

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

        if (options.request) {
            await options.request(child);
        }

        const handlers = child.resolveAll(CloudHandler);
        return executeChain(handlers, event);
    };
}
