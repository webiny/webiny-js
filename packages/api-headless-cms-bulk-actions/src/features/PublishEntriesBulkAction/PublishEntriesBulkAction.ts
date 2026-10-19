import { ListLatestEntriesUseCase } from "@webiny/api-headless-cms/features/contentEntry/ListEntries/index.js";
import { PublishEntryUseCase } from "@webiny/api-headless-cms/features/contentEntry/PublishEntry/index.js";
import { EntriesBulkAction } from "~/features/EntriesBulkAction/abstractions.js";

class PublishEntriesBulkActionImpl implements EntriesBulkAction.Interface {
    readonly name = "publish";

    constructor(
        private listLatestEntries: ListLatestEntriesUseCase.Interface,
        private publishEntry: PublishEntryUseCase.Interface
    ) {}

    async loadData(
        model: EntriesBulkAction.Model,
        params: EntriesBulkAction.LoadDataParams
    ): Promise<EntriesBulkAction.LoadDataResult> {
        const { where, ...rest } = params;

        const entriesResult = await this.listLatestEntries.execute(model, {
            ...rest,
            where: {
                ...where,
                status_not: "published"
            }
        });

        if (entriesResult.isFail()) {
            throw entriesResult.error;
        }

        return entriesResult.value;
    }

    async processData(
        model: EntriesBulkAction.Model,
        params: EntriesBulkAction.ProcessParams
    ): Promise<void> {
        await this.publishEntry.execute(model, params.id);
    }
}

export const PublishEntriesBulkAction = EntriesBulkAction.createImplementation({
    implementation: PublishEntriesBulkActionImpl,
    dependencies: [ListLatestEntriesUseCase, PublishEntryUseCase]
});
