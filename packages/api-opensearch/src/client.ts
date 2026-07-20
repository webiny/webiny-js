import crypto from "crypto";
import WebinyError from "@webiny/error";
import { Client } from "@opensearch-project/opensearch";
import type { ClientOptions } from "@opensearch-project/opensearch";

export interface OpenSearchClientOptions extends ClientOptions {
    endpoint?: string;
}

export { Client };
export type { OpenSearchClientOptions as ClientOptions };

const clients = new Map<string, Client>();

const createClientKey = (options: OpenSearchClientOptions): string => {
    const key = JSON.stringify(options);
    const hash = crypto.createHash("sha256");
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

    const clientOptions: ClientOptions = {
        node: endpoint || node,
        ...rest
    };

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
        throw new WebinyError("Could not connect to OpenSearch.", "OPENSEARCH_CLIENT_ERROR", data);
    }
};
