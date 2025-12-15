import { ListLatestEntriesUseCase } from "@webiny/api-headless-cms/features/contentEntry/ListEntries/index.js";
import { DeleteEntryUseCase } from "@webiny/api-headless-cms/features/contentEntry/DeleteEntry/index.js";
import { parseIdentifier } from "@webiny/utils";
import { EntryBulkAction } from "~/features/EntryBulkAction/abstractions.js";

class MoveToTrashBulkActionImpl implements EntryBulkAction.Interface {
    readonly name = "moveToTrash";

    constructor(
        private listLatestEntries: ListLatestEntriesUseCase.Interface,
        private deleteEntry: DeleteEntryUseCase.Interface
    ) {}

    async loadData(
        model: EntryBulkAction.Model,
        params: EntryBulkAction.LoadDataParams
    ): Promise<EntryBulkAction.LoadDataResult> {
        const entriesResult = await this.listLatestEntries.execute(model, params);

        const [entries, meta] = entriesResult.value;

        return { entries, meta };
    }

    async processData(
        model: EntryBulkAction.Model,
        params: EntryBulkAction.ProcessParams
    ): Promise<void> {
        const { id: entryId } = parseIdentifier(params.id);

        await this.deleteEntry.execute(model, entryId, {
            permanently: false
        });
    }
}

export const MoveToTrashBulkAction = EntryBulkAction.createImplementation({
    implementation: MoveToTrashBulkActionImpl,
    dependencies: [ListLatestEntriesUseCase, DeleteEntryUseCase]
});
