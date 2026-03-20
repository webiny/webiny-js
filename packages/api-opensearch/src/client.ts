import crypto from "crypto";
import WebinyError from "@webiny/error";
import { Client } from "@opensearch-project/opensearch";
import type { ClientOptions } from "@opensearch-project/opensearch";
import { AwsSigv4Signer } from "@opensearch-project/opensearch/aws";

export interface OpenSearchClientOptions extends ClientOptions {
    endpoint?: string;
}

export { Client };
export type { ClientOptions };

const clients = new Map<string, Client>();

const createClientKey = (options: OpenSearchClientOptions): string => {
    const key = JSON.stringify(options);
    const hash = crypto.createHash("sha1");
    hash.update(key);
    return hash.digest("hex");
};

export const createOpenSearchClient = (options: OpenSearchClientOptions): Client => {
    const key = createClientKey(options);
    const existing = clients.get(key);
    if (existing) {
        return existing;
    }

    const { endpoint, node, ...rest } = options;

    let clientOptions: ClientOptions = {
        node: endpoint || node,
        ...rest
    };

    if (!clientOptions.auth) {
        const region = process.env.AWS_REGION;
        if (!region) {
            throw new WebinyError("Missing AWS_REGION environment variable.", "MISSING_AWS_REGION");
        }

        clientOptions = {
            ...clientOptions,
            ...AwsSigv4Signer({
                region,
                service: "es",
                getCredentials: () => {
                    const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
                    const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
                    const sessionToken = process.env.AWS_SESSION_TOKEN;

                    if (!accessKeyId || !secretAccessKey) {
                        throw new WebinyError(
                            "Missing AWS credentials (AWS_ACCESS_KEY_ID or AWS_SECRET_ACCESS_KEY).",
                            "MISSING_AWS_CREDENTIALS"
                        );
                    }

                    return Promise.resolve({ accessKeyId, secretAccessKey, sessionToken });
                }
            })
        };
    }

    try {
        const client = new Client(clientOptions);
        clients.set(key, client);
        return client;
    } catch (ex) {
        const data = {
            error: ex,
            node: endpoint || node,
            ...rest,
            auth: undefined
        };
        console.error(data);
        throw new WebinyError(
            "Could not connect to OpenSearch.",
            "OPENSEARCH_CLIENT_ERROR",
            data
        );
    }
};
