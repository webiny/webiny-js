import { esPutIndexSettings } from "~/utils";
import { Logger } from "@webiny/data-migration";
import { Client } from "@elastic/elasticsearch";

interface IndexSettings {
    number_of_replicas: number;
    refresh_interval: `${number}s`;
}

interface RestoreOriginalElasticsearchSettingsParams {
    indexSettings: {
        [index: string]: IndexSettings | null;
    };
    logger: Logger;
    elasticsearchClient: Client;
}

export const restoreOriginalElasticsearchSettings = async (
    params: RestoreOriginalElasticsearchSettingsParams
): Promise<void> => {
    const { indexSettings, logger } = params;

    const indexes = indexSettings;
    if (!indexes || typeof indexes !== "object") {
        return;
    }

    for (const index in indexes) {
        const settings = indexes[index];
        if (!settings || typeof settings !== "object") {
            continue;
        }
        try {
            await esPutIndexSettings({
                elasticsearchClient: params.elasticsearchClient,
                index,
                settings: {
                    number_of_replicas: settings.number_of_replicas || 1,
                    refresh_interval: settings.refresh_interval || `1s`
                }
            });
        } catch (ex) {
            logger.error(
                `Failed to restore original settings for index "${index}". Please do it manually.`
            );
            logger.error({
                ...ex,
                message: ex.message,
                code: ex.code,
                data: ex.data
            });
        }
    }
};
