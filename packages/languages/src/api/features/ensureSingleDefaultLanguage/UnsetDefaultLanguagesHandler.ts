import { EntryAfterUpdateEventHandler } from "@webiny/api-headless-cms/features/contentEntry/UpdateEntry/events.js";
import { GetModelUseCase } from "@webiny/api-headless-cms/features/contentModel/GetModel/abstractions.js";
import { ListLatestEntriesUseCase } from "@webiny/api-headless-cms/features/contentEntry/ListEntries/abstractions.js";
import { LANGUAGE_MODEL_ID } from "~/shared/constants.js";
import { UpdateEntryRepository } from "@webiny/api-headless-cms/features/contentEntry/UpdateEntry/abstractions.js";

class UnsetDefaultLanguagesHandler implements EntryAfterUpdateEventHandler.Interface {
    constructor(
        private getModel: GetModelUseCase.Interface,
        private listLatestEntries: ListLatestEntriesUseCase.Interface,
        private updateEntry: UpdateEntryRepository.Interface
    ) {}

    async handle(event: EntryAfterUpdateEventHandler.Event): Promise<void> {
        const { entry, model } = event.payload;

        if (model.modelId !== LANGUAGE_MODEL_ID) {
            return;
        }

        if (!entry.values.isDefault) {
            return;
        }

        const modelResult = await this.getModel.execute(LANGUAGE_MODEL_ID);
        if (modelResult.isFail()) {
            return;
        }

        const languageModel = modelResult.value;

        const listResult = await this.listLatestEntries.execute(languageModel, {
            where: {
                entryId_not: entry.entryId,
                values: {
                    isDefault: true
                }
            }
        });

        if (listResult.isFail()) {
            return;
        }

        const { entries } = listResult.value;

        for (const other of entries) {
            await this.updateEntry.execute(languageModel, {
                ...other,
                values: {
                    ...other.values,
                    isDefault: false
                }
            });
        }
    }
}

export default EntryAfterUpdateEventHandler.createImplementation({
    implementation: UnsetDefaultLanguagesHandler,
    dependencies: [GetModelUseCase, ListLatestEntriesUseCase, UpdateEntryRepository]
});
