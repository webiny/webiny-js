import { Context as BaseContext } from "@webiny/api";
import type { Context } from "@webiny/handler/types";
import { PluginsContainer } from "@webiny/plugins";
import type { TestOpenSearchClient } from "@webiny/api-opensearch/testing";
import type { OpenSearchContext } from "@webiny/api-opensearch/types.js";
import type { Reply, Request } from "@webiny/handler-aws/types.js";

export interface ICreateMockContextParams {
    plugins?: PluginsContainer;
    elasticsearch: TestOpenSearchClient;
}

export const createMockContext = (
    params: ICreateMockContextParams
): OpenSearchContext & Context => {
    const context = new BaseContext({
        plugins: params.plugins || new PluginsContainer(),
        WEBINY_VERSION: "0.0.0"
    }) as unknown as OpenSearchContext;

    context.opensearch = params.elasticsearch;
    context.elasticsearch = params.elasticsearch;
    // @ts-expect-error
    context.reply = {} as Reply;
    // @ts-expect-error
    context.request = {} as Request;

    return context as unknown as Context & OpenSearchContext;
};
