import { createFeature } from "@webiny/feature/api";
import { ObfuscatePasswordOnEntryAfterUpdate } from "./ObfuscatePasswordOnEntryAfterUpdate.js";
import { ObfuscatePasswordOnEntryAfterCreate } from "./ObfuscatePasswordOnEntryAfterCreate.js";

export const ObfuscatePasswordFeature = createFeature({
    name: "ObfuscatePassword",
    register(container) {
        container.register(ObfuscatePasswordOnEntryAfterCreate);
        container.register(ObfuscatePasswordOnEntryAfterUpdate);
    }
});
