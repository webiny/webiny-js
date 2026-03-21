import type { CmsModel } from "@webiny/api-headless-cms/types/index.js";
import WebinyError from "@webiny/error";
import type { CmsContext } from "~/types.js";
import {
    getOpenSearchIndexPrefix as getElasticsearchIndexPrefix,
    getLastAddedIndexPlugin,
    isSharedOpenSearchIndex as isSharedElasticsearchIndex
} from "@webiny/api-opensearch";
import type { OpenSearchIndexRequestBody as ElasticsearchIndexRequestBody } from "@webiny/api-opensearch/types.js";
import { CmsEntryElasticsearchIndexPlugin } from "~/plugins/index.js";

interface ConfigurationsElasticsearch {
    index: string;
}

export interface CmsElasticsearchParams {
    model: Pick<CmsModel, "tenant" | "modelId">;
}

export interface ConfigurationsIndexSettingsParams {
    context: CmsContext;
}

export interface Configurations {
    es: (params: CmsElasticsearchParams) => ConfigurationsElasticsearch;
    indexSettings: (
        params: ConfigurationsIndexSettingsParams
    ) => Partial<ElasticsearchIndexRequestBody>;
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

        const prefix = getElasticsearchIndexPrefix();

        if (!prefix) {
            return {
                index
            };
        }
        return {
            index: prefix + index
        };
    },
    indexSettings: ({ context }) => {
        const plugin = getLastAddedIndexPlugin<CmsEntryElasticsearchIndexPlugin>({
            container: context.plugins,
            type: CmsEntryElasticsearchIndexPlugin.type
        });

        return plugin ? plugin.body : {};
    }
};
