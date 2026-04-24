import { EntryAfterDeleteEventHandler } from "@webiny/app-headless-cms/exports/admin/cms.js";
import { LanguagesCache } from "./abstractions.js";
import { LANGUAGE_MODEL_ID } from "~/shared/constants.js";

class LanguageEntryAfterDeleteHandlerImpl implements EntryAfterDeleteEventHandler.Interface {
    constructor(private cache: LanguagesCache.Interface) {}

    async handle(event: EntryAfterDeleteEventHandler.Event): Promise<void> {
        if (event.payload.model.modelId !== LANGUAGE_MODEL_ID) {
            return;
        }

        this.cache.removeItems(item => item.id === event.payload.entryId);
    }
}

export const LanguageEntryAfterDeleteHandler = EntryAfterDeleteEventHandler.createImplementation({
    implementation: LanguageEntryAfterDeleteHandlerImpl,
    dependencies: [LanguagesCache]
});
