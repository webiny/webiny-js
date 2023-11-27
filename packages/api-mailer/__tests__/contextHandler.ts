import { createHandler, createEventHandler } from "@webiny/handler-aws/raw";
import { until, sleep } from "./context/helpers";
import { MailerContext } from "~/types";
import { CreateHandlerParams, createHandlerPlugins } from "./handlerPlugins";
import { LambdaContext } from "@webiny/handler-aws/types";

export const createContextHandler = (params?: CreateHandlerParams) => {
    const handle = createHandler<any, MailerContext>({
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
