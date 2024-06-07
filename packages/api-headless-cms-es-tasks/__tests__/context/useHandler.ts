import { createHandlerCore, CreateHandlerCoreParams } from "./plugins";
import { createRawEventHandler, createRawHandler } from "@webiny/handler-aws";
import { Context } from "~/types";
import { defaultIdentity } from "./tenancySecurity";
import { LambdaContext } from "@webiny/handler-aws/types";
import { getElasticsearchClient } from "@webiny/project-utils/testing/elasticsearch";

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

    const { elasticsearchClient } = getElasticsearchClient({ name: "api-headless-cms-ddb-es" });

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
                    "x-webiny-cms-locale": "en-US",
                    "x-tenant": "root"
                },
                ...input
            };
            return handler(payload, {} as LambdaContext);
        }
    };
};
