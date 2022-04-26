import WebinyError from "@webiny/error";
import { ElasticsearchContext } from "~/types";
import { ContextPlugin } from "@webiny/handler";
import { createElasticsearchClient, ElasticsearchClientOptions } from "~/client";
import { getElasticsearchOperators } from "~/operators";
import { Client } from "@elastic/elasticsearch";

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
