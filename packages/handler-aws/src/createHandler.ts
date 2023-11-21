import { HandlerFactory } from "~/types";
import { registry } from "./registry";

export const createHandler: HandlerFactory = params => {
    return async (event, context) => {
        const handler = registry.getHandler(event, context);
        return handler.handle({
            params,
            event,
            context
        });
    };
};
