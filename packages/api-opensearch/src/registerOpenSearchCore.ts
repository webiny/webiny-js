import { createRegisterExtensionPlugin } from "@webiny/handler";
import { getOpenSearchOperators } from "~/operators.js";
import { OpenSearchContextFeature } from "~/features/OpenSearchContext/feature.js";
import { OpenSearchClientFeature } from "~/features/OpenSearchClient/feature.js";
import { OpenSearchClientFactoryFeature } from "~/features/OpenSearchClientFactory/feature.js";
import type { OpenSearchContext } from "~/types.js";
import type { OpenSearchClientOptions } from "~/client.js";
import { Client, createOpenSearchClient } from "~/client.js";

export const registerOpenSearchCore = (params: OpenSearchClientOptions | Client) => {
    // OpenSearchContext is narrower than Context, but we know that the context will be of type OpenSearchContext, so we can safely ignore the TypeScript error here.
    // TODO remove the context altogether as soon as possible.
    // @ts-expect-error
    return createRegisterExtensionPlugin<OpenSearchContext>(async context => {
        if (context.opensearch) {
            throw new Error("OpenSearch context must not be loaded more than once!");
        }
        const client = params instanceof Client ? params : createOpenSearchClient(params);
        context.opensearch = client;
        context.elasticsearch = client;

        context.plugins.register(getOpenSearchOperators());

        OpenSearchContextFeature.register(context.container, context);
        OpenSearchClientFeature.register(context.container);
        OpenSearchClientFactoryFeature.register(context.container);
    });
};
