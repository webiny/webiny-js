import { ListLatestEntriesUseCase } from "@webiny/api-headless-cms/features/contentEntry/ListEntries/index.js";
import { MoveEntryUseCase } from "@webiny/api-headless-cms/features/contentEntry/MoveEntry/index.js";
import { EntriesBulkAction } from "~/features/EntriesBulkAction/abstractions.js";

class MoveToFolderBulkActionImpl implements EntriesBulkAction.Interface {
    readonly name = "moveToFolder";

    constructor(
        private listLatestEntries: ListLatestEntriesUseCase.Interface,
        private moveEntry: MoveEntryUseCase.Interface
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
        if (!params.data?.folderId) {
            throw new Error(`Missing "data.folderId" in the input.`);
        }

        await this.moveEntry.execute(model, params.id, params.data.folderId);
    }
}

export const MoveToFolderBulkAction = EntriesBulkAction.createImplementation({
    implementation: MoveToFolderBulkActionImpl,
    dependencies: [ListLatestEntriesUseCase, MoveEntryUseCase]
});
