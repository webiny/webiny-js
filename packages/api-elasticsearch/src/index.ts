/**
 * TODO File should contain only exports from other files.
 */
import WebinyError from "@webiny/error";
import { ElasticsearchContext } from "~/types";
import { ContextPlugin } from "@webiny/api";
import { createElasticsearchClient, ElasticsearchClientOptions } from "~/client";
import { getElasticsearchOperators } from "~/operators";
import { Client } from "@elastic/elasticsearch";

export * from "./indexConfiguration";
export * from "./plugins";
export * from "./sort";
export * from "./indices";
export * from "./where";
export * from "./limit";
export * from "./normalize";
export * from "./compression";
export * from "./operators";
export * from "./cursors";
export * from "./client";
export * from "./utils";
export * from "./operations";
export * from "./sharedIndex";
export * from "./indexPrefix";
export { createGzipCompression } from "./plugins/GzipCompression";

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
                "ELASTICSEARCH_ALREADY_INITIALIZED"
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
