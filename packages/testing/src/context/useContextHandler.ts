import type { CreateHandlerCoreParams } from "./plugins.js";
import { createHandlerCore } from "./plugins.js";
import { createRawEventHandler, createRawHandler } from "@webiny/handler-aws";
import type { Context } from "~/types.js";
import { defaultIdentity } from "./tenancySecurity.js";
import type { LambdaContext } from "@webiny/handler-aws/types.js";
import { getElasticsearchClient } from "@webiny/project-utils/testing/elasticsearch/index.js";

export interface HandlerEvent {
    path: string;
    headers: {
        ["x-tenant"]: string;
        [key: string]: string;
    };
}

export interface UseContextHandlerParams extends CreateHandlerCoreParams {
    debug?: boolean;
}
export const useContextHandler = <C extends Context = Context>(
    params: UseContextHandlerParams = {}
) => {
    const debug = params.debug || process.env.DEBUG === "true";
    if (debug) {
        process.env.DEBUG = "true";
    }
    const core = createHandlerCore(params);

    const plugins = [...core.plugins].concat([
        createRawEventHandler<HandlerEvent, C, C>(async ({ context }) => {
            return context;
        })
    ]);

    const { elasticsearchClient } = getElasticsearchClient({ name: "testing-ddb-es" });

    return {
        plugins,
        identity: params.identity || defaultIdentity,
        tenant: core.tenant,
        locale: core.locale,
        elasticsearch: elasticsearchClient,
        context: (input?: HandlerEvent) => {
            const handler = createRawHandler<HandlerEvent, C>({
                plugins,
                debug
            });
            const payload: HandlerEvent = {
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
