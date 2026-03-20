import WebinyError from "@webiny/error";
import type { OpenSearchContext } from "~/types.js";
import { ContextPlugin } from "@webiny/api";
import type { OpenSearchClientOptions } from "~/client.js";
import { createOpenSearchClient, Client } from "~/client.js";
import { getOpenSearchOperators } from "~/operators.js";

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

export default (params: OpenSearchClientOptions | Client): ContextPlugin<OpenSearchContext> => {
    return new ContextPlugin<OpenSearchContext>(context => {
        if (context.opensearch) {
            throw new WebinyError(
                "OpenSearch client is already initialized, no need to define it again. Check your code for duplicate initializations.",
                "OPENSEARCH_ALREADY_INITIALIZED"
            );
        }
        context.opensearch = params instanceof Client ? params : createOpenSearchClient(params);

        context.plugins.register(getOpenSearchOperators());
    });
};
