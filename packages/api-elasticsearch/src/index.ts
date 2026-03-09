/**
 * TODO File should contain only exports from other files.
 */
import WebinyError from "@webiny/error";
import type { ElasticsearchContext } from "~/types.js";
import { ContextPlugin } from "@webiny/api";
import type { ElasticsearchClientOptions } from "~/client.js";
import { createElasticsearchClient } from "~/client.js";
import { getElasticsearchOperators } from "~/operators.js";
import { Client } from "@elastic/elasticsearch/index.js";

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

/**
 * We must accept either Elasticsearch client or options that create the client.
 */
export default (
    params: ElasticsearchClientOptions | Client
): ContextPlugin<ElasticsearchContext> => {
    return new ContextPlugin<ElasticsearchContext>(context => {
        if (context.elasticsearch) {
            throw new WebinyError(
                "Elasticsearch client is already initialized, no need to define it again. Check your code for duplicate initializations.",
                "OPENSEARCH_ALREADY_INITIALIZED"
            );
        }
        /**
         * Initialize the Elasticsearch client.
         */
        context.elasticsearch =
            params instanceof Client ? params : createElasticsearchClient(params);

        context.plugins.register(getElasticsearchOperators());
    });
};
