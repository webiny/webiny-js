import { GetModelUseCase } from "~/features/model/getModel/abstractions.js";
import { GetEntryUseCase } from "~/features/contentEntry/getEntry/abstractions.js";
import { ServerEntryChangedEventHandler } from "./abstractions.js";

/**
 * Reads the entry's latest revision back and puts it into that model's entries cache, which the
 * entries list renders from. Read back rather than taken from the message, so the entry has the same
 * fields as one the admin loads itself. `GetEntryUseCase` does the caching.
 */
class RefreshChangedEntryInCacheImpl implements ServerEntryChangedEventHandler.Interface {
    constructor(
        private getModel: GetModelUseCase.Interface,
        private getEntry: GetEntryUseCase.Interface
    ) {}

    async handle(event: ServerEntryChangedEventHandler.Event): Promise<void> {
        const { modelId, entryId } = event.payload;
        const model = await this.getModel.execute({ modelId });
        await this.getEntry.execute({ model, id: entryId });
    }
}

export const RefreshChangedEntryInCache = ServerEntryChangedEventHandler.createImplementation({
    implementation: RefreshChangedEntryInCacheImpl,
    dependencies: [GetModelUseCase, GetEntryUseCase]
});
