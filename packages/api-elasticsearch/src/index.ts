import { Client, ClientOptions } from "@elastic/elasticsearch";
import AWS from "aws-sdk";
import createAwsElasticsearchConnector from "aws-elasticsearch-connector";
import { ElasticsearchContext } from "~/types";
import { ContextPlugin } from "@webiny/handler/plugins/ContextPlugin";
import {
    ElasticsearchQueryBuilderOperatorBetweenPlugin,
    ElasticsearchQueryBuilderOperatorNotBetweenPlugin,
    ElasticsearchQueryBuilderOperatorContainsPlugin,
    ElasticsearchQueryBuilderOperatorNotContainsPlugin,
    ElasticsearchQueryBuilderOperatorEqualPlugin,
    ElasticsearchQueryBuilderOperatorNotPlugin,
    ElasticsearchQueryBuilderOperatorGreaterThanPlugin,
    ElasticsearchQueryBuilderOperatorGreaterThanOrEqualToPlugin,
    ElasticsearchQueryBuilderOperatorLesserThanPlugin,
    ElasticsearchQueryBuilderOperatorLesserThanOrEqualToPlugin,
    ElasticsearchQueryBuilderOperatorInPlugin,
    ElasticsearchQueryBuilderOperatorAndInPlugin,
    ElasticsearchQueryBuilderOperatorNotInPlugin
} from "~/plugins/operator";
import WebinyError from "@webiny/error";

interface ElasticsearchClientOptions extends ClientOptions {
    endpoint?: string;
}

export default (options: ElasticsearchClientOptions): ContextPlugin<ElasticsearchContext> => {
    const { endpoint, node, ...rest } = options;
    return new ContextPlugin<ElasticsearchContext>(context => {
        if (context.elasticsearch) {
            throw new WebinyError(
                "Elasticsearch client is already initialized, no need to define it again. Check your code for duplicate initializations.",
                "ELASTICSEARCH_ALREADY_INITIALIZED"
            );
        }
        const clientOptions: ClientOptions = {
            node: endpoint || node,
            ...rest
        };

        if (!clientOptions.auth) {
            /**
             * If no `auth` configuration is present, we setup AWS connector.
             */
            Object.assign(clientOptions, createAwsElasticsearchConnector(AWS.config));
        }
        /**
         * Initialize the Elasticsearch client.
         */
        context.elasticsearch = new Client(clientOptions);

        context.plugins.register([
            new ElasticsearchQueryBuilderOperatorBetweenPlugin(),
            new ElasticsearchQueryBuilderOperatorNotBetweenPlugin(),
            new ElasticsearchQueryBuilderOperatorContainsPlugin(),
            new ElasticsearchQueryBuilderOperatorNotContainsPlugin(),
            new ElasticsearchQueryBuilderOperatorEqualPlugin(),
            new ElasticsearchQueryBuilderOperatorNotPlugin(),
            new ElasticsearchQueryBuilderOperatorGreaterThanPlugin(),
            new ElasticsearchQueryBuilderOperatorGreaterThanOrEqualToPlugin(),
            new ElasticsearchQueryBuilderOperatorLesserThanPlugin(),
            new ElasticsearchQueryBuilderOperatorLesserThanOrEqualToPlugin(),
            new ElasticsearchQueryBuilderOperatorInPlugin(),
            new ElasticsearchQueryBuilderOperatorAndInPlugin(),
            new ElasticsearchQueryBuilderOperatorNotInPlugin()
        ]);
    });
};
