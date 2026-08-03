export {
    CmsModelOpenSearchIndexProvider,
    type ICmsModelOpenSearchIndexProvider,
    type ICmsModelOpenSearchIndexProviderResult
} from "@webiny/api-headless-cms-utils-os/features/CmsModelOpenSearchIndex/CmsModelOpenSearchIndexProvider.js";
import { CmsModelOpenSearchIndexProvider } from "@webiny/api-headless-cms-utils-os/features/CmsModelOpenSearchIndex/CmsModelOpenSearchIndexProvider.js";
import type { ICmsModelOpenSearchIndexProviderResult } from "@webiny/api-headless-cms-utils-os/features/CmsModelOpenSearchIndex/CmsModelOpenSearchIndexProvider.js";
import { CmsModelOpenSearchIndex } from "./abstractions.js";

class CmsModelOpenSearchIndexProviderImpl implements CmsModelOpenSearchIndexProvider.Interface {
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
