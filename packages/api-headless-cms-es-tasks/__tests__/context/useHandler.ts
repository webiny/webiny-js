import type { CreateHandlerCoreParams } from "./plugins";
import { createHandlerCore } from "./plugins";
import { createRawEventHandler, createRawHandler } from "@webiny/handler-aws";
import type { Context } from "~/types";
import { defaultIdentity } from "./tenancySecurity";
import type { LambdaContext } from "@webiny/handler-aws/types";
import { createTestOpenSearchClient } from "@webiny/api-opensearch/testing";

interface CmsHandlerEvent {
    path: string;
    headers: {
        ["x-tenant"]: string;
        [key: string]: string;
    };
}

type Params = CreateHandlerCoreParams;
export const useHandler = <C extends Context = Context>(params: Params = {}) => {
    const core = createHandlerCore(params);

    const plugins = [...core.plugins].concat([
        createRawEventHandler<CmsHandlerEvent, C, C>(async ({ context }) => {
            return context;
        })
    ]);

    const handler = createRawHandler<CmsHandlerEvent, C>({
        plugins,
        debug: process.env.DEBUG === "true"
    });

    const elasticsearchClient = createTestOpenSearchClient();

    return {
        plugins,
        identity: params.identity || defaultIdentity,
        tenant: core.tenant,
        elasticsearch: elasticsearchClient,
        handler: (input?: CmsHandlerEvent) => {
            const payload: CmsHandlerEvent = {
                path: "/cms/manage/en-US",
                headers: {
                    "x-webiny-cms-endpoint": "manage",
                    "x-tenant": "root"
                },
                ...input
            };
            return handler(payload, {} as LambdaContext);
        }
    };
};
