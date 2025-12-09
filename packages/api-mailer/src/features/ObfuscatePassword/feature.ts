import { createFeature } from "@webiny/feature/api";
import type { Container } from "@webiny/di";
import { ObfuscatePasswordOnEntryAfterUpdate } from "./ObfuscatePasswordOnEntryAfterUpdate.js";
import { ObfuscatePasswordOnEntryAfterCreate } from "./ObfuscatePasswordOnEntryAfterCreate.js";

export const ObfuscatePasswordFeature = createFeature({
    name: "ObfuscatePassword",
    register(container: Container) {
        container.register(ObfuscatePasswordOnEntryAfterCreate);
        container.register(ObfuscatePasswordOnEntryAfterUpdate);
    }
});
