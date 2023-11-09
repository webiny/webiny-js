import createAwsElasticsearchConnector from "aws-elasticsearch-connector";
import crypto from "crypto";
import WebinyError from "@webiny/error";
import { Client, ClientOptions } from "@elastic/elasticsearch";
import { fromTemporaryCredentials } from "@webiny/aws-sdk/credential-providers";

export interface ElasticsearchClientOptions extends ClientOptions {
    endpoint?: string;
}

const clients = new Map<string, Promise<Client>>();

const createClientKey = (options: ElasticsearchClientOptions) => {
    const key = JSON.stringify(options);
    const hash = crypto.createHash("sha1");
    hash.update(key);
    return hash.digest("hex");
};

export const createElasticsearchClient = async (
    options: ElasticsearchClientOptions
): Promise<Client> => {
    const key = createClientKey(options);
    const existing = clients.get(key);
    if (existing) {
        return existing;
    }

    const cached = async () => {
        const { endpoint, node, ...rest } = options;

        const clientOptions: ClientOptions = {
            node: endpoint || node,
            ...rest
        };

        if (!clientOptions.auth) {
            /**
             * If no `auth` configuration is present, we setup AWS connector.
             */
            const credentials = await fromTemporaryCredentials({
                params: {
                    RoleArn: "arn:aws:iam::0123456789012:role/Administrator",
                    RoleSessionName: "temporary-session",
                    DurationSeconds: 3600
                }
            })();

            Object.assign(
                clientOptions,
                // @ts-expect-error
                createAwsElasticsearchConnector({
                    region: process.env.AWS_REGION,
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

    const client = cached();

    clients.set(key, client);
    return client;
};

export const runElasticsearchClientCommand = async <T>(
    client: Promise<Client> | Client,
    cb: (client: Client) => Promise<T>
): Promise<T> => {
    /**
     * Possibly no client sent? Probably in tests.
     */
    if (!client) {
        throw new Error(`Missing client!`);
    }
    if (client instanceof Promise) {
        return cb(await client);
    }
    return cb(client);
};
