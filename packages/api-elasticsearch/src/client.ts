import { Client, ClientOptions } from "@elastic/elasticsearch";
import AWS from "aws-sdk";
/**
 * Package aws-elasticsearch-connector does not have types.
 */
// @ts-ignore
import createAwsElasticsearchConnector from "aws-elasticsearch-connector";

export interface ElasticsearchClientOptions extends ClientOptions {
    endpoint?: string;
}

export const createElasticsearchClient = (options: ElasticsearchClientOptions) => {
    const { endpoint, node, ...rest } = options;

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

    return new Client(clientOptions);
};
