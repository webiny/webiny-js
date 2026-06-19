import { createRegisterExtensionPlugin } from "@webiny/handler";
import { OpenSearchClientFeature } from "~/features/OpenSearchClient/feature.js";
import { OpenSearchClientFactoryFeature } from "~/features/OpenSearchClientFactory/feature.js";
import { OpenSearchQueryBuilderOperatorFeature } from "~/features/OpenSearchQueryBuilderOperator/feature.js";
import type { OpenSearchClientOptions } from "~/client.js";
import { Client, createOpenSearchClient } from "~/client.js";

export const registerOpenSearchCore = (params: OpenSearchClientOptions | Client) => {
    return createRegisterExtensionPlugin(async context => {
        // @ts-expect-error
        if (context.__registeredOpensearch) {
            throw new Error("OpenSearch core must not be loaded more than once!");
        }
        const client = params instanceof Client ? params : createOpenSearchClient(params);
        // @ts-expect-error
        context.__registeredOpensearch = true;

        OpenSearchClientFeature.register(context.container, client);
        OpenSearchClientFactoryFeature.register(context.container);
        OpenSearchQueryBuilderOperatorFeature.register(context.container);
    });
};
