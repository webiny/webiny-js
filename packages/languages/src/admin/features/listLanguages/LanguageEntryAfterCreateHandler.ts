import { EntryAfterCreateEventHandler } from "@webiny/app-headless-cms/exports/admin/cms.js";
import { LanguagesCache } from "./abstractions.js";
import { LANGUAGE_MODEL_ID } from "~/shared/constants.js";
import { toLanguageDto } from "./toLanguageDto.js";

class LanguageEntryAfterCreateHandlerImpl implements EntryAfterCreateEventHandler.Interface {
    constructor(private cache: LanguagesCache.Interface) {}

    async handle(event: EntryAfterCreateEventHandler.Event): Promise<void> {
        if (event.payload.model.modelId !== LANGUAGE_MODEL_ID) {
            return;
        }

        this.cache.addItems([toLanguageDto(event.payload.entry)]);
    }
}

export const LanguageEntryAfterCreateHandler = EntryAfterCreateEventHandler.createImplementation({
    implementation: LanguageEntryAfterCreateHandlerImpl,
    dependencies: [LanguagesCache]
});
