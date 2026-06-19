import type { Client } from "~/client.js";
import type { OpenSearchIndex } from "~/features/OpenSearchIndex/abstractions/OpenSearchIndex.js";
import WebinyError from "@webiny/error";

interface OnExists {
    (): void;
}

interface OnError {
    (ex: Error): Error;
}

interface ExistsIndexParams {
    client: Client;
    index: string;
    onExists?: OnExists;
}

const indexExists = async (params: ExistsIndexParams): Promise<boolean> => {
    const { client, index, onExists } = params;

    try {
        const response = await client.indices.exists({
            index,
            ignore_unavailable: false,
            allow_no_indices: true,
            include_defaults: true,
            flat_settings: false,
            local: false
        });
        if (!response.body) {
            return false;
        }
        if (onExists) {
            onExists();
        }
        return true;
    } catch {
        console.error(`Could not determine if the index "${index}" exists.`);
    }
    return false;
};

interface IndexCreateParams {
    client: Client;
    index: string;
    type: string;
    tenant: string;
    plugin: OpenSearchIndex.Interface;
    onError?: OnError;
}

const indexCreate = async (params: IndexCreateParams): Promise<void> => {
    const { client, index, plugin, tenant, type, onError } = params;

    try {
        await client.indices.create({
            index,
            body: {
                ...plugin.body
            }
        });
    } catch (ex) {
        let error = ex;
        if (onError) {
            error = onError(ex);
        }
        throw new WebinyError(
            error.message || `Could not create OpenSearch index for the ${type}.`,
            error.code || "CREATE_OPENSEARCH_INDEX_ERROR",
            {
                error: {
                    ...error,
                    message: error.message,
                    code: error.code,
                    data: error.data
                },
                type,
                tenant,
                index,
                body: plugin.body
            }
        );
    }
};

interface CreateIndexParams {
    client: Client;
    plugin: OpenSearchIndex.Interface;
    type: string;
    tenant: string;
    index: string;
    onExists?: OnExists;
    onError?: OnError;
}

export const createIndex = async (params: CreateIndexParams): Promise<void> => {
    const { plugin, onExists } = params;

    const exists = await indexExists(params);
    if (exists) {
        if (onExists) {
            onExists();
        }
        return;
    }

    await indexCreate({
        ...params,
        plugin
    });
};
