import { createRawEventHandler, createRawHandler } from "@webiny/handler-aws";
import type { LambdaContext } from "@webiny/handler-aws/types";
import type { HandlerParams } from "./plugins";
import { handlerPlugins } from "./plugins";
import { getDocumentClient } from "@webiny/project-utils/testing/dynamodb/index.js";
import { ServiceDiscovery } from "@webiny/api";

export const useHandler = (params: HandlerParams = {}) => {
    const corePlugins = handlerPlugins(params);
    
    ServiceDiscovery.setDocumentClient(getDocumentClient());

    const plugins = [...corePlugins].concat([
        createRawEventHandler(async ({ context }) => {
            return context;
        })
    ]);

    const handler = createRawHandler({
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
