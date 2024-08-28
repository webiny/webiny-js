import { Client } from "@elastic/elasticsearch";
import { PluginsContainer } from "@webiny/plugins";
import { getLastAddedIndexPlugin } from "~/indices";
import { ElasticsearchIndexPlugin } from "~/plugins";
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
    } catch (ex) {
        console.error(`Could not determine if the index "${index}" exists.`);
        console.log(ex);
    }
    return false;
};

interface IndexCreateParams {
    client: Client;
    index: string;
    type: string;
    tenant: string;
    locale: string;
    plugin: ElasticsearchIndexPlugin;
    onError?: OnError;
}

const indexCreate = async (params: IndexCreateParams): Promise<void> => {
    const { client, index, plugin, tenant, locale, type, onError } = params;

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
            error.message || `Could not create Elasticsearch index for the ${type}.`,
            error.code || "CREATE_ELASTICSEARCH_INDEX_ERROR",
            {
                error: {
                    ...error,
                    message: error.message,
                    code: error.code,
                    data: error.data
                },
                type,
                locale,
                tenant,
                index,
                body: plugin.body
            }
        );
    }
};

interface CreateIndexParams {
    client: Client;
    plugins: PluginsContainer;
    type: string;
    tenant: string;
    locale: string;
    index: string;
    onExists?: OnExists;
    onError?: OnError;
}

export const createIndex = async (params: CreateIndexParams): Promise<void> => {
    const { plugins, type, locale, onExists } = params;
    const plugin = getLastAddedIndexPlugin<ElasticsearchIndexPlugin>({
        container: plugins,
        type,
        locale
    });

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
