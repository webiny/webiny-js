import { EntryAfterUpdateEventHandler } from "@webiny/app-headless-cms/exports/admin/cms.js";
import { LanguagesCache } from "./abstractions.js";
import { LANGUAGE_MODEL_ID } from "~/shared/constants.js";
import { toLanguageDto } from "./toLanguageDto.js";

class LanguageEntryAfterUpdateHandlerImpl implements EntryAfterUpdateEventHandler.Interface {
    constructor(private cache: LanguagesCache.Interface) {}

    async handle(event: EntryAfterUpdateEventHandler.Event): Promise<void> {
        if (event.payload.model.modelId !== LANGUAGE_MODEL_ID) {
            return;
        }

        const updated = toLanguageDto(event.payload.entry);
        this.cache.updateItems(item => {
            if (item.id === updated.id) {
                return updated;
            }
            return item;
        });
    }
}

export const LanguageEntryAfterUpdateHandler = EntryAfterUpdateEventHandler.createImplementation({
    implementation: LanguageEntryAfterUpdateHandlerImpl,
    dependencies: [LanguagesCache]
});
