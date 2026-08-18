import { ListLatestEntriesUseCase } from "@webiny/api-headless-cms/features/contentEntry/ListEntries/index.js";
import { DeleteEntryUseCase } from "@webiny/api-headless-cms/features/contentEntry/DeleteEntry/index.js";
import { EntriesBulkAction } from "~/features/EntriesBulkAction/abstractions.js";

class MoveToTrashBulkActionImpl implements EntriesBulkAction.Interface {
    readonly name = "moveToTrash";

    constructor(
        private listLatestEntries: ListLatestEntriesUseCase.Interface,
        private deleteEntry: DeleteEntryUseCase.Interface
    ) {}

    async loadData(
        model: EntriesBulkAction.Model,
        params: EntriesBulkAction.LoadDataParams
    ): Promise<EntriesBulkAction.LoadDataResult> {
        const entriesResult = await this.listLatestEntries.execute(model, params);

        return entriesResult.value;
    }

    async processData(
        model: EntriesBulkAction.Model,
        params: EntriesBulkAction.ProcessParams
    ): Promise<void> {
        await this.deleteEntry.execute(model, params.id, {
            permanently: false
        });
    }
}

export const MoveToTrashBulkAction = EntriesBulkAction.createImplementation({
    implementation: MoveToTrashBulkActionImpl,
    dependencies: [ListLatestEntriesUseCase, DeleteEntryUseCase]
});
