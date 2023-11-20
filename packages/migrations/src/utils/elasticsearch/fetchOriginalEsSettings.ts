import { esGetIndexSettings } from "~/utils";
import { Logger } from "@webiny/data-migration";
import { Client } from "@elastic/elasticsearch";

interface FetchOriginalElasticsearchSettingsParams {
    elasticsearchClient: Client;
    index: string;
    logger: Logger;
}

interface IndexSettings {
    number_of_replicas: number;
    refresh_interval: `${number}s`;
}

export const fetchOriginalElasticsearchSettings = async (
    params: FetchOriginalElasticsearchSettingsParams
): Promise<IndexSettings | null> => {
    const { index, logger } = params;
    try {
        const settings = await esGetIndexSettings({
            elasticsearchClient: params.elasticsearchClient,
            index,
            fields: ["number_of_replicas", "refresh_interval"]
        });
        return {
            number_of_replicas: settings.number_of_replicas || 1,
            refresh_interval: settings.refresh_interval || "1s"
        };
    } catch (ex) {
        logger.error(`Failed to fetch original Elasticsearch settings for index "${index}".`);
        logger.error({
            ...ex,
            message: ex.message,
            code: ex.code,
            data: ex.data
        });
    }

    return null;
};
