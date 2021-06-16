import { Client, ClientOptions } from "@elastic/elasticsearch";
import AWS from "aws-sdk";
import createAwsElasticsearchConnector from "aws-elasticsearch-connector";
import { ContextPlugin } from "@webiny/handler/types";

interface ElasticsearchClientOptions extends ClientOptions {
    endpoint?: string;
}

export default (options: ElasticsearchClientOptions): ContextPlugin => {
    const { endpoint, node, ...rest } = options;

    return {
        type: "context",
        name: "context-elastic-search",
        async apply(context) {
            const clientOptions: ClientOptions = {
                node: endpoint || node,
                ...rest
            };

            if (!clientOptions.auth) {
                // If no `auth` configuration is present, we setup AWS connector.
                Object.assign(clientOptions, createAwsElasticsearchConnector(AWS.config));
            }

            context.elasticSearch = new Client(clientOptions);
        }
    };
};
