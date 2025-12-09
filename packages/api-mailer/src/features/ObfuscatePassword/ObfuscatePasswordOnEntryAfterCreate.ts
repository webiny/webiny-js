import { EntryAfterCreateHandler } from "@webiny/api-headless-cms/features/contentEntry/CreateEntry/events.js";
import { SETTINGS_MODEL_ID } from "~/crud/settings/model.js";
import { obfuscatePassword } from "~/features/ObfuscatePassword/obfuscatePassword.js";

export class OnEntryAfterCreate implements EntryAfterCreateHandler.Interface {
    async handle(event: EntryAfterCreateHandler.Event): Promise<void> {
        const { model, entry, input } = event.payload;

        if (model.modelId !== SETTINGS_MODEL_ID) {
            return;
        }

        // Remove password from input
        delete input["password"];

        // Obfuscate password in entry values
        entry.values = obfuscatePassword(entry.values);
    }
}

export const ObfuscatePasswordOnEntryAfterCreate = EntryAfterCreateHandler.createImplementation({
    implementation: OnEntryAfterCreate,
    dependencies: []
});
