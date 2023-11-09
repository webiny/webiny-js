import WebinyError from "@webiny/error";
import { Client, ClientOptions } from "@elastic/elasticsearch";
// eslint-disable-next-line
import { fromTemporaryCredentials } from "@webiny/aws-sdk/credential-providers";
// eslint-disable-next-line
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

    if (Object.getOwnPropertyNames(clientOptions?.auth || {}).length === 0) {
        clientOptions.auth = undefined;
    }

    // if (!clientOptions.auth) {
    //     /**
    //      * If no `auth` configuration is present, we setup AWS connector.
    //      */
    //     const credentials = fromTemporaryCredentials({
    //         params: {
    //             RoleArn: "arn:aws:iam::0123456789012:role/Administrator",
    //             RoleSessionName: "temporary-session",
    //             DurationSeconds: 3600
    //         }
    //     })();
    //
    //     Object.assign(
    //         clientOptions,
    //         // @ts-ignore
    //         createAwsElasticsearchConnector({
    //             region: process.env.AWS_REGION
    //         })
    //     );
    // }

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
