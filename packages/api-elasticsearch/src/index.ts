import { ElasticsearchContext } from "~/types";
import { ContextPlugin } from "@webiny/handler/plugins/ContextPlugin";
import WebinyError from "@webiny/error";
import { createClient, ElasticsearchClientOptions } from "~/client";
import { getOperators } from "~/operators";

export default (options: ElasticsearchClientOptions): ContextPlugin<ElasticsearchContext> => {
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
        context.elasticsearch = createClient(options);

        context.plugins.register(getOperators());
    });
};
