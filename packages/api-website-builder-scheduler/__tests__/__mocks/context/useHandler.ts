import type { CreateHandlerCoreParams } from "./plugins";
import { createHandlerCore } from "./plugins";
import { createRawEventHandler, createRawHandler } from "@webiny/handler-aws";
import { defaultIdentity } from "./tenancySecurity";
import type { LambdaContext } from "@webiny/handler-aws/types";
import { createTestOpenSearchClient } from "@webiny/api-opensearch/testing";
import type { ApiCoreContext } from "@webiny/api-core/types/core.js";
import { createWebsiteBuilderScheduleContext } from "~/context.js";

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
        }),
        createWebsiteBuilderScheduleContext()
    ]);

    const handler = createRawHandler<WbHandlerEvent, C>({
        plugins,
        debug: process.env.DEBUG === "true"
    });

    const elasticsearchClient = createTestOpenSearchClient();

    return {
        plugins,
        identity: params.identity || defaultIdentity,
        tenant: core.tenant,
        elasticsearch: elasticsearchClient,
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
