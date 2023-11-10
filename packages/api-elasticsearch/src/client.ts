import createAwsElasticsearchConnector from "aws-elasticsearch-connector";
import crypto from "crypto";
import WebinyError from "@webiny/error";
import { fromEnv } from "@webiny/aws-sdk/credential-providers";
import { Client, ClientOptions } from "@elastic/elasticsearch";

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

        // @ts-ignore
        if (!clientOptions.auth) {
            const region = String(process.env.AWS_REGION);

            const creds = await fromEnv()();

            console.log("creds from env");
            for (const key in creds) {
                // @ts-ignore
                const value = creds[key];
                console.log(`${key}: ${!!value} / ${typeof value} / ${value?.length}`);
            }

            const keys = {
                accessKeyId: String(process.env.AWS_ACCESS_KEY_ID),
                secretAccessKey: String(process.env.AWS_SECRET_ACCESS_KEY),
                sessionToken: String(process.env.AWS_SESSION_TOKEN)
            };
            const credentials = {
                ...keys,
                envPrefix: "AWS",
                expired: false,
                expireTime: null,
                refreshCallbacks: []
            };

            const config = {
                credentials,
                region
            };
            console.log("assigned creds");
            for (const key in keys) {
                // @ts-ignore
                const value = keys[key];
                const has = !!value;
                const length = value?.length;
                console.log(`${key}: ${has} / ${typeof value} / ${length}`);
            }

            Object.assign(
                clientOptions,
                // @ts-ignore
                createAwsElasticsearchConnector(config)
            );
        }

        try {
            return new Client({
                ...clientOptions
            });
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
