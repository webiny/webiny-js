import createAwsElasticsearchConnector from "aws-elasticsearch-connector";
import crypto from "crypto";
import WebinyError from "@webiny/error";
import { Client, ClientOptions } from "@elastic/elasticsearch";
// import { AssumeRoleCommand, STSClient } from "@webiny/aws-sdk/client-sts";
// eslint-disable-next-line
import { fromProcess } from "@webiny/aws-sdk/credential-providers";

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

// const assumeRole = async (roleArn: string, region: string) => {
//     const client = new STSClient({
//         region
//     });
//     const response = await client.send(
//         new AssumeRoleCommand({
//             RoleArn: roleArn,
//             RoleSessionName: "aws-es-connection"
//         })
//     );
//     return {
//         accessKeyId: response.Credentials!.AccessKeyId as string,
//         secretAccessKey: response.Credentials!.SecretAccessKey as string,
//         sessionToken: response.Credentials!.SessionToken as string
//     };
// };

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
            const region = String(process.env.AWS_REGION);
            // const credentials = await assumeRole(
            //     "arn:aws:iam::0123456789012:role/Administrator",
            //     region
            // );
            // const credentials = await fromProcess()();

            const credentials = {
                accessKeyId: String(process.env.AWS_ACCESS_KEY_ID),
                secretAccessKey: String(process.env.AWS_SECRET_ACCESS_KEY),
                sessionToken: String(process.env.AWS_SESSION_TOKEN)
            };

            for (const key in credentials) {
                // @ts-ignore
                console.log(`${key}: ${!!credentials[key] ? "has" : "not set"}`);
            }

            Object.assign(
                clientOptions,

                // @ts-expect-error
                createAwsElasticsearchConnector({
                    region,
                    credentials,
                    getCredentials: () => credentials
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
