import WebinyError from "@webiny/error";
import { Client } from "@elastic/elasticsearch";

export interface PutIndexSettingsParams {
    elasticsearchClient: Client;
    index: string;
    settings: Record<string, any>;
}

export const esPutIndexSettings = async (params: PutIndexSettingsParams) => {
    const { elasticsearchClient, index, settings } = params;

    try {
        await elasticsearchClient.indices.putSettings({
            index,
            body: settings
        });
    } catch (ex) {
        throw new WebinyError(
            ex.message || "Could not put Elasticsearch index settings.",
            ex.code || "PUT_ELASTICSEARCH_INDEX_SETTINGS_ERROR",
            {
                error: ex,
                index,
                settings
            }
        );
    }
};
