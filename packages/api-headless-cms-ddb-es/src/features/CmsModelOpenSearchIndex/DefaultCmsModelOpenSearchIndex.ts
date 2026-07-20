import { getBaseConfiguration, isSharedOpenSearchIndex } from "@webiny/api-opensearch";
import { CmsModelOpenSearchIndex } from "./abstractions.js";

class DefaultCmsModelOpenSearchIndexImpl implements CmsModelOpenSearchIndex.Interface {
    public async execute(
        params: CmsModelOpenSearchIndex.Params
    ): Promise<CmsModelOpenSearchIndex.Result> {
        const { model } = params;
        const shared = isSharedOpenSearchIndex();
        const index = [shared ? "root" : model.tenant, "headless-cms", model.modelId]
            .join("-")
            .toLowerCase();

        return {
            index,
            settings: getBaseConfiguration(),
            shared
        };
    }
}

export const DefaultCmsModelOpenSearchIndex = CmsModelOpenSearchIndex.createImplementation({
    implementation: DefaultCmsModelOpenSearchIndexImpl,
    dependencies: []
});
