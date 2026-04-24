import type { CmsModel } from "@webiny/api-headless-cms/types/index.js";
import WebinyError from "@webiny/error";
import {
    getOpenSearchIndexPrefix,
    isSharedOpenSearchIndex as isSharedElasticsearchIndex
} from "@webiny/api-opensearch";
import type { OpenSearchIndexRequestBody } from "@webiny/api-opensearch/types.js";
import type { CmsEntryOpenSearchIndex } from "~/features/CmsEntryOpenSearchIndex/index.js";

interface ConfigurationsElasticsearch {
    index: string;
}

export interface CmsElasticsearchParams {
    model: Pick<CmsModel, "tenant" | "modelId">;
}

export interface ConfigurationsIndexSettingsParams {
    indexConfigs: CmsEntryOpenSearchIndex.Interface[];
    model: Pick<CmsModel, "tenant" | "modelId" | "group">;
}

export interface Configurations {
    es: (params: CmsElasticsearchParams) => ConfigurationsElasticsearch;
    indexSettings: (
        params: ConfigurationsIndexSettingsParams
    ) => Partial<OpenSearchIndexRequestBody>;
}

export const configurations: Configurations = {
    es({ model }) {
        const { tenant } = model;

        if (!tenant) {
            throw new WebinyError(
                `Missing "tenant" parameter when trying to create Elasticsearch index name.`,
                "TENANT_ERROR"
            );
        }

        const sharedIndex = isSharedElasticsearchIndex();
        const index = [sharedIndex ? "root" : tenant, "headless-cms", model.modelId]
            .join("-")
            .toLowerCase();

        const prefix = getOpenSearchIndexPrefix();

        if (!prefix) {
            return {
                index
            };
        }
        return {
            index: prefix + index
        };
    },
    indexSettings: ({ indexConfigs, model }) => {
        const usable = indexConfigs.filter(c => c.canUse({ model }));
        if (usable.length === 0) {
            return {};
        }
        return usable[usable.length - 1].body;
    }
};
