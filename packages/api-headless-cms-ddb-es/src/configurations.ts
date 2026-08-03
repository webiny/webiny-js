import { getOpenSearchIndexPrefix } from "@webiny/api-opensearch";
import type {
    CmsModelOpenSearchIndexProvider,
    ICmsModelOpenSearchIndexProviderResult
} from "~/features/CmsModelOpenSearchIndex/index.js";
import type { StorageCmsModel } from "@webiny/api-headless-cms/types/index.js";

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
