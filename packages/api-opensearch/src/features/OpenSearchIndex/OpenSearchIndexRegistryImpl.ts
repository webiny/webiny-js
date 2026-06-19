import WebinyError from "@webiny/error";
import { OpenSearchIndex } from "./abstractions/OpenSearchIndex.js";
import { OpenSearchIndexRegistry as Abstraction } from "./abstractions/OpenSearchIndexRegistry.js";

class OpenSearchIndexRegistryImplClass implements Abstraction.Interface {
    private readonly indices: OpenSearchIndex.Interface[];

    public constructor(indices: OpenSearchIndex.Interface[]) {
        this.indices = indices;
    }

    public getLastAdded(): OpenSearchIndex.Interface {
        const usable = this.indices.filter(index => index.canUse());
        if (usable.length === 0) {
            throw new WebinyError(
                "Could not find a single OpenSearchIndex.",
                "OPENSEARCH_INDEX_TEMPLATE_ERROR"
            );
        }
        return usable[usable.length - 1];
    }

    public getAll(): OpenSearchIndex.Interface[] {
        return this.indices.filter(index => index.canUse());
    }
}

export const OpenSearchIndexRegistryImpl = Abstraction.createImplementation({
    implementation: OpenSearchIndexRegistryImplClass,
    dependencies: [[OpenSearchIndex, { multiple: true }]]
});
