import { RecordChangedEventHandler } from "@webiny/app/features/recordChanges/index.js";
import { GetModelUseCase } from "~/features/model/getModel/abstractions.js";
import { GetEntryUseCase } from "~/features/contentEntry/getEntry/abstractions.js";
import { ContentEntriesCacheProvider } from "~/features/contentEntry/abstractions.js";

/*
 * Sent by the api for entries, with the model id in `scope`; see `ENTRY_RECORD_TYPE` in
 * @webiny/api-headless-cms.
 */
const ENTRY_RECORD_TYPE = "cms.entry";

/**
 * Keeps each model's entries cache, which the entries list renders from, in step with the server. A
 * created or updated entry has its latest revision read back, and `GetEntryUseCase` puts it in the
 * cache; read back rather than taken from the message, so the entry has the same fields as one the
 * admin loads itself. A deleted entry cannot be read back, so it is taken out.
 */
class ApplyEntryChangeToCacheImpl implements RecordChangedEventHandler.Interface {
    constructor(
        private getModel: GetModelUseCase.Interface,
        private getEntry: GetEntryUseCase.Interface,
        private cacheProvider: ContentEntriesCacheProvider.Interface
    ) {}

    async handle(event: RecordChangedEventHandler.Event): Promise<void> {
        const { type, id, scope: modelId, change } = event.payload;
        if (type !== ENTRY_RECORD_TYPE || !modelId) {
            return;
        }

        if (change === "deleted") {
            const cache = this.cacheProvider.get(modelId);
            cache.removeItems(entry => entry.entryId === id);
            return;
        }

        const model = await this.getModel.execute({ modelId });
        await this.getEntry.execute({ model, id });
    }
}

export const ApplyEntryChangeToCache = RecordChangedEventHandler.createImplementation({
    implementation: ApplyEntryChangeToCacheImpl,
    dependencies: [GetModelUseCase, GetEntryUseCase, ContentEntriesCacheProvider]
});
