import type { ICloudHandler } from "./abstractions/CloudHandler.js";

export function executeChain(handlers: ICloudHandler[], event: any): Promise<any> {
    if (handlers.length === 0) {
        throw new Error("No handlers registered in container");
    }

    let chain = (_ev: any): Promise<any> => {
        throw new Error("No registered handler claimed this event");
    };

    for (let i = handlers.length - 1; i >= 0; i--) {
        const handler = handlers[i];
        const nextChain = chain;
        chain = (ev: any) => {
            const next = (newEvent?: any) => nextChain(newEvent ?? ev);
            return handler.execute(ev, next);
        };
    }

    return chain(event);
}
