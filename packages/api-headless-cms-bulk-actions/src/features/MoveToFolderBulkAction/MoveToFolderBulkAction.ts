import { ListLatestEntriesUseCase } from "@webiny/api-headless-cms/features/contentEntry/ListEntries/index.js";
import { MoveEntryUseCase } from "@webiny/api-headless-cms/features/contentEntry/MoveEntry/index.js";
import { parseIdentifier } from "@webiny/utils";
import { EntryBulkAction } from "~/features/EntryBulkAction/abstractions.js";

class MoveToFolderBulkActionImpl implements EntryBulkAction.Interface {
    readonly name = "moveToFolder";

    constructor(
        private listLatestEntries: ListLatestEntriesUseCase.Interface,
        private moveEntry: MoveEntryUseCase.Interface
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
        if (!params.data?.folderId) {
            throw new Error(`Missing "data.folderId" in the input.`);
        }

        const { id: entryId } = parseIdentifier(params.id);

        await this.moveEntry.execute(model, entryId, params.data.folderId);
    }
}

export const MoveToFolderBulkAction = EntryBulkAction.createImplementation({
    implementation: MoveToFolderBulkActionImpl,
    dependencies: [ListLatestEntriesUseCase, MoveEntryUseCase]
});
