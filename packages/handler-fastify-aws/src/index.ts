import {
    createHandler as createDefaultHandler,
    CreateHandlerParams as CreateDefaultHandlerParams
} from "@webiny/handler-fastify";
import { createAwsFastifyHandler } from "~/handler";

export const createHandler = (params: CreateDefaultHandlerParams) => {
    return createDefaultHandler({
        plugins: [createAwsFastifyHandler(), ...(params.plugins || [])],
        options: {
            ...(params.options || {})
        }
    });
};
