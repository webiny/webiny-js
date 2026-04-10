import type { Client } from "@webiny/api-opensearch";
import WebinyError from "@webiny/error";
import { configurations } from "~/configurations.js";
import type { CmsModel } from "@webiny/api-headless-cms/types/index.js";
import type { CmsEntryOpenSearchIndex } from "~/features/CmsEntryOpenSearchIndex/index.js";

export interface CreateElasticsearchIndexParams {
    client: Client;
    indexConfigs: CmsEntryOpenSearchIndex.Interface[];
    model: CmsModel;
}

interface IGetLastUsableParams {
    configs: CmsEntryOpenSearchIndex.Interface[];
    model: CmsModel;
}

const getLastUsable = (params: IGetLastUsableParams): CmsEntryOpenSearchIndex.Interface => {
    const { configs } = params;
    const usable = configs.filter(c => c.canUse(params));
    if (usable.length === 0) {
        throw new WebinyError(
            "Could not find a single usable CmsEntryOpenSearchIndex.",
            "OPENSEARCH_INDEX_TEMPLATE_ERROR"
        );
    }
    return usable[usable.length - 1];
};

export const createElasticsearchIndex = async (params: CreateElasticsearchIndexParams) => {
    const { client, indexConfigs, model } = params;

    const { index } = configurations.es({
        model
    });

    const config = getLastUsable({
        configs: indexConfigs,
        model
    });
    if (!config) {
        /**
         * This can happen only while development as we have a base index setting that is always usable.
         */
        throw new Error(
            `Could not find a usable CmsEntryOpenSearchIndex for the CMS model "${model.name}".`
        );
    }

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
                ...config.body
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
                body: config.body
            }
        );
    }
};
