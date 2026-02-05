import { esGetIndexSettings } from "~/utils/index.js";
import type { Logger } from "@webiny/data-migration";
import type { Client } from "@elastic/elasticsearch";

interface FetchOriginalElasticsearchSettingsParams {
    elasticsearchClient: Client;
    index: string;
    logger: Logger;
}

interface IndexSettings {
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
            fields: ["refresh_interval"]
        });
        return {
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
