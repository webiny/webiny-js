import type { IEventHandler, EventContext } from "./abstractions/EventHandler.js";

export function executeChain(handlers: IEventHandler[], event: any): Promise<any> {
    if (handlers.length === 0) {
        throw new Error("No handlers registered in container");
    }

    const initialCtx: EventContext = { event, metadata: {} };

    let chain = (_ctx: EventContext): Promise<any> => {
        throw new Error("No registered handler claimed this event");
    };

    for (let i = handlers.length - 1; i >= 0; i--) {
        const handler = handlers[i];
        const nextChain = chain;
        chain = (ctx: EventContext) => {
            const next = (newCtx?: EventContext) => nextChain(newCtx ?? ctx);
            return handler.execute(ctx, next);
        };
    }

    return chain(initialCtx);
}
