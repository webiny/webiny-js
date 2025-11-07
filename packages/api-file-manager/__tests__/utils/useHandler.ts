import { createRawEventHandler, createRawHandler } from "@webiny/handler-aws";
import type { LambdaContext } from "@webiny/handler-aws/types";
import type { FileManagerContext } from "~/types";
import type { HandlerParams } from "./plugins";
import { handlerPlugins } from "./plugins";

export const useHandler = (params: HandlerParams = {}) => {
    const corePlugins = handlerPlugins(params);

    const plugins = [...corePlugins].concat([
        createRawEventHandler<any, FileManagerContext, FileManagerContext>(async ({ context }) => {
            return context;
        })
    ]);

    const handler = createRawHandler<any, FileManagerContext>({
        plugins,
        debug: process.env.DEBUG === "true"
    });
    return {
        plugins,
        handler: () => {
            return handler(
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
