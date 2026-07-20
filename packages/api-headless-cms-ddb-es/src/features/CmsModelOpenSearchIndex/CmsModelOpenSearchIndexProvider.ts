import { createAbstraction } from "@webiny/feature/api/index.js";
import type { OpenSearchIndexRequestBody } from "@webiny/api-opensearch/types.js";
import { CmsModelOpenSearchIndex } from "./abstractions.js";

export interface ICmsModelOpenSearchIndexProviderResult {
    index: string;
    settings: OpenSearchIndexRequestBody;
    shared: boolean;
}

export interface ICmsModelOpenSearchIndexProvider {
    execute(
        params: CmsModelOpenSearchIndex.Params
    ): Promise<ICmsModelOpenSearchIndexProviderResult>;
}

export const CmsModelOpenSearchIndexProvider = createAbstraction<ICmsModelOpenSearchIndexProvider>(
    "Cms/Model/OpenSearch/IndexProvider"
);

export namespace CmsModelOpenSearchIndexProvider {
    export type Interface = ICmsModelOpenSearchIndexProvider;
    export type Result = ICmsModelOpenSearchIndexProviderResult;
}

class CmsModelOpenSearchIndexProviderImpl implements ICmsModelOpenSearchIndexProvider {
    private readonly cache = new Map<string, ICmsModelOpenSearchIndexProviderResult>();

    public constructor(private readonly indexConfig: CmsModelOpenSearchIndex.Interface) {}

    public async execute(
        params: CmsModelOpenSearchIndex.Params
    ): Promise<ICmsModelOpenSearchIndexProviderResult> {
        const key = `${params.model.tenant}:${params.model.modelId}`;
        const cached = this.cache.get(key);
        if (cached) {
            return cached;
        }

        const { shared, settings } = await this.indexConfig.execute(params);

        const index = [shared ? "root" : params.model.tenant, "headless-cms", params.model.modelId]
            .join("-")
            .toLowerCase();

        const result: ICmsModelOpenSearchIndexProviderResult = { index, settings, shared };
        this.cache.set(key, result);
        return result;
    }
}

export const DefaultCmsModelOpenSearchIndexProvider =
    CmsModelOpenSearchIndexProvider.createImplementation({
        implementation: CmsModelOpenSearchIndexProviderImpl,
        dependencies: [CmsModelOpenSearchIndex]
    });
