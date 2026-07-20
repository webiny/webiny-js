import WebinyError from "@webiny/error";
import {
    getBaseConfiguration,
    getOpenSearchIndexPrefix,
    isSharedOpenSearchIndex
} from "@webiny/api-opensearch";
import type { CmsModel } from "@webiny/api-headless-cms/types/index.js";
import type { CmsModelOpenSearchIndexProvider } from "~/features/CmsModelOpenSearchIndex/index.js";
import type {
    ICmsModelOpenSearchIndexModel,
    ICmsModelOpenSearchIndexResult
} from "~/features/CmsModelOpenSearchIndex/abstractions.js";

export interface CmsElasticsearchParams {
    model: ICmsModelOpenSearchIndexModel;
}

export interface ConfigurationsElasticsearchResult extends ICmsModelOpenSearchIndexResult {
    index: string;
}

export interface Configurations {
    es: (params: CmsElasticsearchParams) => Promise<ConfigurationsElasticsearchResult>;
}

export const createConfigurations = (
    provider: CmsModelOpenSearchIndexProvider.Interface
): Configurations => ({
    async es({ model }) {
        const result = await provider.execute({ model });

        const prefix = getOpenSearchIndexPrefix();

        if (!prefix) {
            return result;
        }
        return {
            ...result,
            index: prefix + result.index
        };
    }
});

/**
 * Static configurations using the default index name formula.
 * Used by tests and code that does not need DI-based customization.
 */
export const configurations = {
    es(params: { model: Pick<CmsModel, "modelId" | "tenant"> }) {
        const { model } = params;
        const { tenant } = model;

        if (!tenant) {
            throw new WebinyError(
                `Missing "tenant" parameter when trying to create Elasticsearch index name.`,
                "TENANT_ERROR"
            );
        }

        const shared = isSharedOpenSearchIndex();
        const index = [shared ? "root" : tenant, "headless-cms", model.modelId]
            .join("-")
            .toLowerCase();

        const prefix = getOpenSearchIndexPrefix();

        return {
            index: prefix ? prefix + index : index,
            settings: getBaseConfiguration(),
            shared
        };
    }
};
