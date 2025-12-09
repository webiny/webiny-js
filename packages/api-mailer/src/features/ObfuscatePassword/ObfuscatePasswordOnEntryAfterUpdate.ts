import { EntryAfterUpdateHandler } from "@webiny/api-headless-cms/features/contentEntry/UpdateEntry/events.js";
import { SETTINGS_MODEL_ID } from "~/crud/settings/model.js";
import { obfuscatePassword } from "./obfuscatePassword.js";

class OnEntryAfterUpdate implements EntryAfterUpdateHandler.Interface {
    async handle(event: EntryAfterUpdateHandler.Event): Promise<void> {
        const { model, entry, original, input } = event.payload;

        if (model.modelId !== SETTINGS_MODEL_ID) {
            return;
        }

        // Remove password from input
        delete input["password"];

        // Obfuscate password in entry values
        entry.values = obfuscatePassword(entry.values);

        // Obfuscate password in original values
        original.values = obfuscatePassword(original.values);
    }
}

export const ObfuscatePasswordOnEntryAfterUpdate = EntryAfterUpdateHandler.createImplementation({
    implementation: OnEntryAfterUpdate,
    dependencies: []
});
