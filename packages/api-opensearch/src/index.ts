import type { OpenSearchContext } from "~/types.js";
import { ContextPlugin } from "@webiny/api";
import type { OpenSearchClientOptions } from "~/client.js";
import { Client, createOpenSearchClient } from "~/client.js";
import { getOpenSearchOperators } from "~/operators.js";
import { OpenSearchClientFactoryFeature } from "~/features/OpenSearchClientFactory/feature.js";
import { OpenSearchClientFeature } from "~/features/OpenSearchClient/feature.js";
import { OpenSearchClient } from "~/features/OpenSearchClient/abstraction.js";

export * from "./indexConfiguration/index.js";
export * from "./plugins/index.js";
export * from "./sort.js";
export * from "./indices.js";
export * from "./where.js";
export * from "./limit.js";
export * from "./normalize.js";
export * from "./compression.js";
export * from "./operators.js";
export * from "./cursors.js";
export * from "./client.js";
export * from "./utils/index.js";
export * from "./operations/index.js";
export * from "./sharedIndex.js";
export * from "./indexPrefix.js";
export * from "./db/index.js";
export * from "./types.js";

export const createOpenSearchContext = (
    params: OpenSearchClientOptions | Client
): ContextPlugin<OpenSearchContext> => {
    const plugin = new ContextPlugin<OpenSearchContext>(context => {
        if (context.opensearch) {
            throw new Error("OpenSearch context must not be loaded more than once!");
        }
        const client = params instanceof Client ? params : createOpenSearchClient(params);
        context.opensearch = client;
        context.elasticsearch = client;

        context.plugins.register(getOpenSearchOperators());

        OpenSearchClientFeature.register(context.container, context);
        OpenSearchClientFactoryFeature.register(context.container);
        console.log("yes!");
        const r = context.container.resolve(OpenSearchClient);
        const x = 1;
        const y = 2;
        const z = x + y;
        console.log(z);
    });

    plugin.name = "context.opensearch";

    return plugin;
};

export default createOpenSearchContext;
