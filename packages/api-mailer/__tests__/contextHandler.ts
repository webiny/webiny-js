import { createHandler, createEventHandler } from "@webiny/handler-aws/raw";
import { until, sleep } from "./context/helpers";
import type { CreateHandlerParams } from "./handlerPlugins";
import { createHandlerPlugins } from "./handlerPlugins";
import type { LambdaContext } from "@webiny/handler-aws/types";
import type { ApiCoreContext } from "@webiny/api-core/types/core.js";

export const createContextHandler = (params?: CreateHandlerParams) => {
    const handle = createHandler<any, ApiCoreContext>({
        plugins: [
            createEventHandler(async ({ context }) => {
                return context;
            }),
            ...createHandlerPlugins(params)
        ],
        debug: false
    });

    return {
        until,
        sleep,
        handle: async () => {
            return handle(
                {
                    headers: {
                        ["x-tenant"]: "root",
                        ["Content-Type"]: "application/json"
                    }
                },
                {} as LambdaContext
            );
        }
    };
};
