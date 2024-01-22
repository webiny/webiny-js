import createAwsElasticsearchConnector from "aws-elasticsearch-connector";
import crypto from "crypto";
import WebinyError from "@webiny/error";
import { Client, ClientOptions } from "@elastic/elasticsearch";

export interface ElasticsearchClientOptions extends ClientOptions {
    endpoint?: string;
}

const clients = new Map<string, Client>();

const createClientKey = (options: ElasticsearchClientOptions) => {
    const key = JSON.stringify(options);
    const hash = crypto.createHash("sha1");
    hash.update(key);
    return hash.digest("hex");
};

export { Client, ClientOptions };

export const createElasticsearchClient = (options: ElasticsearchClientOptions): Client => {
    const key = createClientKey(options);
    const existing = clients.get(key);
    if (existing) {
        return existing;
    }

    const cached = (): Client => {
        const { endpoint, node, ...rest } = options;

        let clientOptions: ClientOptions = {
            node: endpoint || node,
            ...rest
        };

        if (!clientOptions.auth) {
            const region = String(process.env.AWS_REGION);

            const credentials = {
                accessKeyId: process.env.AWS_ACCESS_KEY_ID,
                secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
                sessionToken: process.env.AWS_SESSION_TOKEN
            };

            const errors = Object.keys(credentials).filter(key => {
                const value = credentials[key as keyof typeof credentials];
                return !value;
            });
            if (errors.length > 0) {
                throw new WebinyError(
                    `Missing keys values: ${errors.join(", ")}`,
                    "MISSING_AWS_CREDENTIALS"
                );
            }

            clientOptions = {
                ...clientOptions,
                ...createAwsElasticsearchConnector({
                    region,
                    // @ts-expect-error
                    credentials
                })
            };
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
