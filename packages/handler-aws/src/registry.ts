/**
 * TODO: refactor this to use a proper DI container
 */
import { HandlerEvent, SourceHandler } from "~/types";
import { Context as LambdaContext } from "aws-lambda/handler";

interface RegisterOptions {
    silent?: boolean;
}

class HandlerRegistry {
    private readonly handlers = new Map<string, SourceHandler>();

    private constructor() {
        /**
         * We don't want this class to be constructed outside the static create() method
         */
    }

    public static create() {
        return new HandlerRegistry();
    }

    public register(handler: SourceHandler<any>, options?: RegisterOptions) {
        if (this.handlers.has(handler.name)) {
            if (options?.silent) {
                return;
            }
            /**
             * This should only happen during the development phase.
             */
            throw new Error(`Handler "${handler.name}" is already registered.`);
        }
        this.handlers.set(handler.name, handler);
    }

    public getHandler(event: HandlerEvent, context: LambdaContext): SourceHandler {
        for (const handler of this.handlers.values()) {
            if (handler.canUse(event, context)) {
                return handler;
            }
        }
        throw new Error(`There is no handler for the event: ${JSON.stringify(event)}`);
    }
}

export type { HandlerRegistry };

export const registry = HandlerRegistry.create();
