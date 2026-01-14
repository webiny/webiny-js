import WebinyError from "@webiny/error";
import type { Client } from "@elastic/elasticsearch";
import pick from "lodash/pick.js";

export interface GetIndexSettingsParams {
    elasticsearchClient: Client;
    index: string;
    fields: string[];
}

export const esGetIndexSettings = async (params: GetIndexSettingsParams) => {
    const { elasticsearchClient, index, fields } = params;

    try {
        const response = await elasticsearchClient.indices.getSettings({
            index
        });

        const settings = response.body[index].settings.index;

        return pick(settings, fields);
    } catch (ex) {
        throw new WebinyError(
            ex.message || "Could not get Elasticsearch index settings.",
            ex.code || "GET_OPENSEARCH_INDEX_SETTINGS_ERROR",
            {
                error: ex,
                index,
                fields
            }
        );
    }
};
