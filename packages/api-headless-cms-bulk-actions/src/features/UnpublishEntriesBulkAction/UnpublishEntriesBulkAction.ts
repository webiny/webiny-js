import { ListPublishedEntriesUseCase } from "@webiny/api-headless-cms/features/contentEntry/ListEntries/index.js";
import { UnpublishEntryUseCase } from "@webiny/api-headless-cms/features/contentEntry/UnpublishEntry/index.js";
import { parseIdentifier } from "@webiny/utils";
import { EntriesBulkAction } from "~/features/EntriesBulkAction/abstractions.js";

class UnpublishEntriesBulkActionImpl implements EntriesBulkAction.Interface {
    readonly name = "unpublish";

    constructor(
        private listPublishedEntries: ListPublishedEntriesUseCase.Interface,
        private unpublishEntry: UnpublishEntryUseCase.Interface
    ) {}

    async loadData(
        model: EntriesBulkAction.Model,
        params: EntriesBulkAction.LoadDataParams
    ): Promise<EntriesBulkAction.LoadDataResult> {
        const entriesResult = await this.listPublishedEntries.execute(model, params);

        const [entries, meta] = entriesResult.value;

        return { entries, meta };
    }

    async processData(
        model: EntriesBulkAction.Model,
        params: EntriesBulkAction.ProcessParams
    ): Promise<void> {
        const { id: entryId } = parseIdentifier(params.id);

        await this.unpublishEntry.execute(model, entryId);
    }
}

export const UnpublishEntriesBulkAction = EntriesBulkAction.createImplementation({
    implementation: UnpublishEntriesBulkActionImpl,
    dependencies: [ListPublishedEntriesUseCase, UnpublishEntryUseCase]
});
