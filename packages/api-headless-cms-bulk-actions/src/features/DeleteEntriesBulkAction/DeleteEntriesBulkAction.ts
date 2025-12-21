import { ListDeletedEntriesUseCase } from "@webiny/api-headless-cms/features/contentEntry/ListEntries/index.js";
import { DeleteEntryUseCase } from "@webiny/api-headless-cms/features/contentEntry/DeleteEntry/index.js";
import { parseIdentifier } from "@webiny/utils";
import { EntriesBulkAction } from "~/features/EntriesBulkAction/abstractions.js";

class DeleteEntriesBulkActionImpl implements EntriesBulkAction.Interface {
    readonly name = "delete";

    constructor(
        private listDeletedEntries: ListDeletedEntriesUseCase.Interface,
        private deleteEntry: DeleteEntryUseCase.Interface
    ) {}

    async loadData(
        model: EntriesBulkAction.Model,
        params: EntriesBulkAction.LoadDataParams
    ): Promise<EntriesBulkAction.LoadDataResult> {
        const entriesResult = await this.listDeletedEntries.execute(model, params);

        const [entries, meta] = entriesResult.value;

        return { entries, meta };
    }

    async processData(
        model: EntriesBulkAction.Model,
        params: EntriesBulkAction.ProcessParams
    ): Promise<void> {
        const { id: entryId } = parseIdentifier(params.id);

        await this.deleteEntry.execute(model, entryId, {
            permanently: true
        });
    }
}

export const DeleteEntriesBulkAction = EntriesBulkAction.createImplementation({
    implementation: DeleteEntriesBulkActionImpl,
    dependencies: [ListDeletedEntriesUseCase, DeleteEntryUseCase]
});
