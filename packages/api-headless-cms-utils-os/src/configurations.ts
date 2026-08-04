import WebinyError from "@webiny/error";
import {
    getBaseConfiguration,
    getOpenSearchIndexPrefix,
    isSharedOpenSearchIndex
} from "@webiny/api-opensearch";
import type { StorageCmsModel } from "@webiny/api-headless-cms/types/index.js";
import type {
    CmsModelOpenSearchIndexProvider,
    ICmsModelOpenSearchIndexProviderResult
} from "./features/CmsModelOpenSearchIndex/CmsModelOpenSearchIndexProvider.js";

export interface CmsElasticsearchParams {
    model: StorageCmsModel;
}

export interface Configurations {
    es: (params: CmsElasticsearchParams) => Promise<ICmsModelOpenSearchIndexProviderResult>;
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
 * @deprecated Use `createConfigurations` with `CmsModelOpenSearchIndexProvider` instead.
 */
export const configurations = {
    es(params: { model: Pick<StorageCmsModel, "tenant" | "modelId"> }) {
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
