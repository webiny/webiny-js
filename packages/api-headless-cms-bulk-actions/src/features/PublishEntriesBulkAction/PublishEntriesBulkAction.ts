import { ListLatestEntriesUseCase } from "@webiny/api-headless-cms/features/contentEntry/ListEntries/index.js";
import { PublishEntryUseCase } from "@webiny/api-headless-cms/features/contentEntry/PublishEntry/index.js";
import { parseIdentifier } from "@webiny/utils";
import { EntryBulkAction } from "~/features/EntryBulkAction/abstractions.js";

class PublishEntriesBulkActionImpl implements EntryBulkAction.Interface {
    readonly name = "publish";

    constructor(
        private listLatestEntries: ListLatestEntriesUseCase.Interface,
        private publishEntry: PublishEntryUseCase.Interface
    ) {}

    async loadData(
        model: EntryBulkAction.Model,
        params: EntryBulkAction.LoadDataParams
    ): Promise<EntryBulkAction.LoadDataResult> {
        const { where, ...rest } = params;

        const entriesResult = await this.listLatestEntries.execute(model, {
            ...rest,
            where: {
                ...where,
                status_not: "published"
            }
        });

        const [entries, meta] = entriesResult.value;

        return { entries, meta };
    }

    async processData(
        model: EntryBulkAction.Model,
        params: EntryBulkAction.ProcessParams
    ): Promise<void> {
        const { id: entryId } = parseIdentifier(params.id);

        await this.publishEntry.execute(model, entryId);
    }
}

export const PublishEntriesBulkAction = EntryBulkAction.createImplementation({
    implementation: PublishEntriesBulkActionImpl,
    dependencies: [ListLatestEntriesUseCase, PublishEntryUseCase]
});
