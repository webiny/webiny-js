import { createAbstraction } from "@webiny/feature/api/index.js";
import { CmsModelOpenSearchIndex } from "./abstractions.js";

export interface ICmsModelOpenSearchIndexProvider {
    execute(params: CmsModelOpenSearchIndex.Params): Promise<CmsModelOpenSearchIndex.Result>;
}

export const CmsModelOpenSearchIndexProvider = createAbstraction<ICmsModelOpenSearchIndexProvider>(
    "Cms/Model/OpenSearch/IndexProvider"
);

export namespace CmsModelOpenSearchIndexProvider {
    export type Interface = ICmsModelOpenSearchIndexProvider;
}

class CmsModelOpenSearchIndexProviderImpl implements ICmsModelOpenSearchIndexProvider {
    private readonly cache = new Map<string, CmsModelOpenSearchIndex.Result>();

    public constructor(private readonly index: CmsModelOpenSearchIndex.Interface) {}

    public async execute(
        params: CmsModelOpenSearchIndex.Params
    ): Promise<CmsModelOpenSearchIndex.Result> {
        const key = `${params.model.tenant}:${params.model.modelId}`;
        const cached = this.cache.get(key);
        if (cached) {
            return cached;
        }

        const result = await this.index.execute(params);
        this.cache.set(key, result);
        return result;
    }
}

export const DefaultCmsModelOpenSearchIndexProvider =
    CmsModelOpenSearchIndexProvider.createImplementation({
        implementation: CmsModelOpenSearchIndexProviderImpl,
        dependencies: [CmsModelOpenSearchIndex]
    });
