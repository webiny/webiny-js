import { ListDeletedEntriesUseCase } from "@webiny/api-headless-cms/features/contentEntry/ListEntries/index.js";
import { DeleteEntryUseCase } from "@webiny/api-headless-cms/features/contentEntry/DeleteEntry/index.js";
import { parseIdentifier } from "@webiny/utils";
import { EntryBulkAction } from "~/features/EntryBulkAction/abstractions.js";

class DeleteEntriesBulkActionImpl implements EntryBulkAction.Interface {
    readonly name = "delete";

    constructor(
        private listDeletedEntries: ListDeletedEntriesUseCase.Interface,
        private deleteEntry: DeleteEntryUseCase.Interface
    ) {}

    async loadData(
        model: EntryBulkAction.Model,
        params: EntryBulkAction.LoadDataParams
    ): Promise<EntryBulkAction.LoadDataResult> {
        const entriesResult = await this.listDeletedEntries.execute(model, params);

        const [entries, meta] = entriesResult.value;

        return { entries, meta };
    }

    async processData(
        model: EntryBulkAction.Model,
        params: EntryBulkAction.ProcessParams
    ): Promise<void> {
        const { id: entryId } = parseIdentifier(params.id);

        await this.deleteEntry.execute(model, entryId, {
            permanently: true
        });
    }
}

export const DeleteEntriesBulkAction = EntryBulkAction.createImplementation({
    implementation: DeleteEntriesBulkActionImpl,
    dependencies: [ListDeletedEntriesUseCase, DeleteEntryUseCase]
});
