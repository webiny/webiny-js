import { esPutIndexSettings } from "~/utils";
import { Logger } from "@webiny/data-migration";
import { Client } from "@elastic/elasticsearch";

interface DisableElasticsearchIndexingParams {
    index: string;
    logger: Logger;
    elasticsearchClient: Client;
}

export const disableElasticsearchIndexing = async (
    params: DisableElasticsearchIndexingParams
): Promise<void> => {
    const { index, logger } = params;

    try {
        await esPutIndexSettings({
            elasticsearchClient: params.elasticsearchClient,
            index,
            settings: {
                number_of_replicas: 0,
                refresh_interval: -1
            }
        });
    } catch (ex) {
        logger.error(`Failed to disable indexing for index "${index}".`);
        logger.error({
            ...ex,
            message: ex.message,
            code: ex.code,
            data: ex.data
        });
    }
};
