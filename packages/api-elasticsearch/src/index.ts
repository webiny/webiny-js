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
export { createGzipCompression } from "./plugins/GzipCompression";

/**
 * We must accept either Elasticsearch client or options that create the client.
 */
export default (
    params: ElasticsearchClientOptions | Client | Promise<Client>
): ContextPlugin<ElasticsearchContext> => {
    return new ContextPlugin<ElasticsearchContext>(async context => {
        if (context.elasticsearch) {
            throw new WebinyError(
                "Elasticsearch client is already initialized, no need to define it again. Check your code for duplicate initializations.",
                "ELASTICSEARCH_ALREADY_INITIALIZED"
            );
        }
        /**
         * Initialize the Elasticsearch client.
         * We need to take care of:
         * * Promise of a client
         * * A constructed client
         * * Options that create the client
         */
        let client: Client;
        if (params instanceof Promise) {
            client = await params;
        } else if (params instanceof Client) {
            client = params;
        } else {
            client = await createElasticsearchClient(params);
        }
        context.elasticsearch = client;

        context.plugins.register(getElasticsearchOperators());
    });
};
