import { ContentEntriesCacheProvider } from "~/features/contentEntry/abstractions.js";
import { ServerEntryDeletedEventHandler } from "./abstractions.js";

/** Takes the deleted entry out of that model's entries cache. A deleted entry cannot be read back. */
class RemoveDeletedEntryFromCacheImpl implements ServerEntryDeletedEventHandler.Interface {
    constructor(private cacheProvider: ContentEntriesCacheProvider.Interface) {}

    async handle(event: ServerEntryDeletedEventHandler.Event): Promise<void> {
        const { modelId, entryId } = event.payload;
        this.cacheProvider.get(modelId).removeItems(entry => entry.entryId === entryId);
    }
}

export const RemoveDeletedEntryFromCache = ServerEntryDeletedEventHandler.createImplementation({
    implementation: RemoveDeletedEntryFromCacheImpl,
    dependencies: [ContentEntriesCacheProvider]
});
