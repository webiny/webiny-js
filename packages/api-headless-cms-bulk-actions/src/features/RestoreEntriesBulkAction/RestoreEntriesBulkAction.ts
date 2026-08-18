import { ListDeletedEntriesUseCase } from "@webiny/api-headless-cms/features/contentEntry/ListEntries/index.js";
import { RestoreEntryFromBinUseCase } from "@webiny/api-headless-cms/features/contentEntry/RestoreEntryFromBin/index.js";
import { EntriesBulkAction } from "~/features/EntriesBulkAction/abstractions.js";

class RestoreEntriesBulkActionImpl implements EntriesBulkAction.Interface {
    readonly name = "restore";

    constructor(
        private listDeletedEntries: ListDeletedEntriesUseCase.Interface,
        private restoreEntry: RestoreEntryFromBinUseCase.Interface
    ) {}

    async loadData(
        model: EntriesBulkAction.Model,
        params: EntriesBulkAction.LoadDataParams
    ): Promise<EntriesBulkAction.LoadDataResult> {
        const entriesResult = await this.listDeletedEntries.execute(model, params);

        return entriesResult.value;
    }

    async processData(
        model: EntriesBulkAction.Model,
        params: EntriesBulkAction.ProcessParams
    ): Promise<void> {
        await this.restoreEntry.execute(model, params.id);
    }
}

export const RestoreEntriesBulkAction = EntriesBulkAction.createImplementation({
    implementation: RestoreEntriesBulkActionImpl,
    dependencies: [ListDeletedEntriesUseCase, RestoreEntryFromBinUseCase]
});
