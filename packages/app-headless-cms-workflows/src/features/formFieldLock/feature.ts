import { createFeature } from "@webiny/feature/admin";
import { CmsEntryFormFieldLock as Abstraction } from "./abstractions.js";
import { CmsEntryFormFieldLock } from "./CmsEntryFormFieldLock.js";
import { CmsEntryFormFieldLockModifier } from "./CmsEntryFormFieldLockModifier.js";

export const CmsEntryFormFieldLockFeature = createFeature({
    name: "Cms/Workflows/EntryFormFieldLock",
    register(container) {
        container.register(CmsEntryFormFieldLock).inSingletonScope();
        container.register(CmsEntryFormFieldLockModifier);
    },
    resolve(container) {
        return {
            fieldLock: container.resolve(Abstraction)
        };
    }
});
