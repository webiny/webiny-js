import type { CreateHandlerCoreParams } from "./plugins.js";
import { createHandlerCore } from "./plugins.js";
import { createRawEventHandler, createRawHandler } from "@webiny/handler-aws";
import { defaultIdentity } from "./tenancySecurity.js";
import type { LambdaContext } from "@webiny/handler-aws/types";
import type { ApiCoreContext } from "@webiny/api-core/types/core.js";

interface WbHandlerEvent {
    path: string;
    headers: {
        ["x-tenant"]: string;
        [key: string]: string;
    };
}

export const useHandler = <C extends ApiCoreContext>(params: CreateHandlerCoreParams) => {
    const core = createHandlerCore(params);

    const plugins = [...core.plugins].concat([
        createRawEventHandler<WbHandlerEvent, C, C>(async ({ context }) => {
            return context;
        })
    ]);

    const handler = createRawHandler<WbHandlerEvent, C>({
        plugins,
        debug: process.env.DEBUG === "true"
    });

    return {
        plugins,
        identity: params.identity || defaultIdentity,
        tenant: core.tenant,
        handler: (input?: WbHandlerEvent) => {
            const payload: WbHandlerEvent = {
                path: "/graphql",
                headers: {
                    "x-tenant": "root"
                },
                ...input
            };
            return handler(payload, {} as LambdaContext);
        }
    };
};
