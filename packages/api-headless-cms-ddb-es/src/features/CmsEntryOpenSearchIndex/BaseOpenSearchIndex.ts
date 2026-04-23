import { getBaseConfiguration } from "@webiny/api-opensearch";
import { CmsEntryOpenSearchIndex } from "./abstractions.js";
import type { OpenSearchIndexRequestBody } from "@webiny/api-opensearch/types.js";

class BaseOpenSearchIndexImpl implements CmsEntryOpenSearchIndex.Interface {
    public readonly body: OpenSearchIndexRequestBody;

    public constructor() {
        this.body = getBaseConfiguration();
    }
    public canUse(_: CmsEntryOpenSearchIndex.CanUseParams): boolean {
        return true;
    }
}

export const BaseOpenSearchIndex = CmsEntryOpenSearchIndex.createImplementation({
    implementation: BaseOpenSearchIndexImpl,
    dependencies: []
});
