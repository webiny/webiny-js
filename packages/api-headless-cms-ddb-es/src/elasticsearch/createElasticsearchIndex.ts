import type { Client } from "@webiny/api-opensearch";
import WebinyError from "@webiny/error";
import type { StorageCmsModel } from "@webiny/api-headless-cms/types/index.js";
import type { Configurations } from "~/configurations.js";

export interface CreateElasticsearchIndexParams {
    client: Client;
    configurations: Configurations;
    model: StorageCmsModel;
}

export const createElasticsearchIndex = async (params: CreateElasticsearchIndexParams) => {
    const { client, configurations, model } = params;

    const { index, settings } = await configurations.es({ model });

    try {
        const response = await client.indices.exists({
            index,
            ignore_unavailable: false,
            allow_no_indices: true,
            include_defaults: true,
            flat_settings: false,
            local: false
        });
        if (response.body) {
            console.log(
                `Elasticsearch index "${index}" for the CMS model "${model.name}" already exists.`
            );
            return;
        }
    } catch {
        console.error(`Could not determine if the index "${index}" exists.`);
    }

    try {
        await client.indices.create({
            index,
            body: {
                ...settings
            }
        });
    } catch (ex) {
        console.error(
            `Could not create Elasticsearch index "${index}" for the CMS model "${model.name}".`
        );
        console.error(ex);
        throw new WebinyError(
            ex.message || "Could not create OpenSearch index for the CMS entry.",
            ex.code || "CREATE_OPENSEARCH_INDEX_ERROR",
            {
                error: {
                    ...ex,
                    message: ex.message,
                    code: ex.code,
                    data: ex.data
                },
                tenant: model.tenant,
                index,
                body: settings
            }
        );
    }
};
