import { createHandlerCore, CreateHandlerCoreParams } from "./plugins";
import { createRawEventHandler, createRawHandler } from "@webiny/handler-aws";
import { CmsContext } from "~/types";
import { defaultIdentity } from "./tenancySecurity";
import { LambdaContext } from "@webiny/handler-aws/types";
import { createTestOpenSearchClient } from "@webiny/api-opensearch/testing";

interface CmsHandlerEvent {
    path: string;
    headers: {
        ["x-tenant"]: string;
        [key: string]: string;
    };
}

type Params = CreateHandlerCoreParams;
export const useHandler = <C extends CmsContext = CmsContext>(params: Params) => {
    const core = createHandlerCore(params);

    const elasticsearchClient = createTestOpenSearchClient();

    const plugins = [...core.plugins].concat([
        createRawEventHandler<CmsHandlerEvent, C, C>(async ({ context }) => {
            return context;
        })
    ]);

    const handler = createRawHandler<CmsHandlerEvent, C>({
        plugins,
        debug: process.env.DEBUG === "true"
    });

    return {
        plugins,
        identity: params.identity || defaultIdentity,
        tenant: core.tenant,
        elasticsearch: elasticsearchClient,
        handler: (payload: CmsHandlerEvent) => {
            return handler(payload, {} as LambdaContext);
        }
    };
};
