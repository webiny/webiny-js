import WebinyError from "@webiny/error";
import { Client, ClientOptions } from "@elastic/elasticsearch";
import { fromProcess } from "@webiny/aws-sdk/credential-providers";
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

    // if (Object.getOwnPropertyNames(clientOptions?.auth || {}).length === 0) {
    //     clientOptions.auth = undefined;
    // }

    if (!clientOptions.auth) {
        const credentials = fromProcess()();

        Object.assign(
            clientOptions,
            createAwsElasticsearchConnector({
                region: process.env.AWS_REGION,
                // @ts-expect-error
                credentials
            })
        );
    }

    try {
        return new Client(clientOptions);
    } catch (ex) {
        const data = {
            error: ex,
            node: endpoint || node,
            ...rest,
            auth: undefined
        };
        console.log({
            ...data
        });
        throw new WebinyError(
            "Could not connect to Elasticsearch.",
            "ELASTICSEARCH_CLIENT_ERROR",
            data
        );
    }
};
