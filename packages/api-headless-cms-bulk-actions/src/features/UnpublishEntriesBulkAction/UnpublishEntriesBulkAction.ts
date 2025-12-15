import { ListPublishedEntriesUseCase } from "@webiny/api-headless-cms/features/contentEntry/ListEntries/index.js";
import { UnpublishEntryUseCase } from "@webiny/api-headless-cms/features/contentEntry/UnpublishEntry/index.js";
import { parseIdentifier } from "@webiny/utils";
import { EntryBulkAction } from "~/features/EntryBulkAction/abstractions.js";

class UnpublishEntriesBulkActionImpl implements EntryBulkAction.Interface {
    readonly name = "unpublish";

    constructor(
        private listPublishedEntries: ListPublishedEntriesUseCase.Interface,
        private unpublishEntry: UnpublishEntryUseCase.Interface
    ) {}

    async loadData(
        model: EntryBulkAction.Model,
        params: EntryBulkAction.LoadDataParams
    ): Promise<EntryBulkAction.LoadDataResult> {
        const entriesResult = await this.listPublishedEntries.execute(model, params);

        const [entries, meta] = entriesResult.value;

        return { entries, meta };
    }

    async processData(
        model: EntryBulkAction.Model,
        params: EntryBulkAction.ProcessParams
    ): Promise<void> {
        const { id: entryId } = parseIdentifier(params.id);

        await this.unpublishEntry.execute(model, entryId);
    }
}

export const UnpublishEntriesBulkAction = EntryBulkAction.createImplementation({
    implementation: UnpublishEntriesBulkActionImpl,
    dependencies: [ListPublishedEntriesUseCase, UnpublishEntryUseCase]
});
