import { getBaseConfiguration, isSharedOpenSearchIndex } from "@webiny/api-opensearch";
import { CmsModelOpenSearchIndex } from "@webiny/api-headless-cms-utils-os/features/CmsModelOpenSearchIndex/abstractions.js";

class DefaultCmsModelOpenSearchIndexImpl implements CmsModelOpenSearchIndex.Interface {
    public async execute(): Promise<CmsModelOpenSearchIndex.Result> {
        return {
            settings: getBaseConfiguration(),
            shared: isSharedOpenSearchIndex()
        };
    }
}

export const DefaultCmsModelOpenSearchIndex = CmsModelOpenSearchIndex.createImplementation({
    implementation: DefaultCmsModelOpenSearchIndexImpl,
    dependencies: []
});
