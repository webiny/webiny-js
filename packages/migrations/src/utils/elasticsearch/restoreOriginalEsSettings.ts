import { esPutIndexSettings } from "~/utils";
import { Logger } from "@webiny/data-migration";
import { Client } from "@elastic/elasticsearch";

interface IndexSettings {
    refresh_interval: `${number}s` | "-1";
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

        // We must ensure that the refresh interval is not set to a negative value. Why?
        // We've had a case where a migration run has been manually stopped, and the index settings
        // were never restored. Once a second run was started and this restore function
        // was called, the refresh interval was set to `-1s`, which effectively disabled indexing.
        let refreshInterval = settings.refresh_interval || `1s`;
        if (refreshInterval === "-1") {
            refreshInterval = "1s";
        }

        try {
            await esPutIndexSettings({
                elasticsearchClient: params.elasticsearchClient,
                index,
                settings: {
                    refresh_interval: refreshInterval
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
