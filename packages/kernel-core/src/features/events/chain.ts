import type { IInputHandler, InputContext } from "~/features/events/InputHandler.js";

export function executeChain(handlers: IInputHandler[], input: any): Promise<any> {
    if (handlers.length === 0) {
        throw new Error("No handlers registered in container");
    }

    const initialCtx: InputContext = { input, metadata: {} };

    let chain = (_ctx: InputContext): Promise<any> => {
        throw new Error("No registered handler claimed this input");
    };

    for (let i = handlers.length - 1; i >= 0; i--) {
        const handler = handlers[i];
        const nextChain = chain;
        chain = (ctx: InputContext) => {
            const next = (newCtx?: InputContext) => nextChain(newCtx ?? ctx);
            return handler.execute(ctx, next);
        };
    }

    return chain(initialCtx);
}
