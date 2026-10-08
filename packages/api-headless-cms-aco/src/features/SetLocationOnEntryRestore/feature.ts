import { createFeature } from "@webiny/feature/api";
import { RestoreEntryFromBinWithFolderFallbackDecorator } from "./RestoreEntryFromBinWithFolderFallbackDecorator.js";

export const SetLocationOnEntryRestoreFeature = createFeature({
    name: "SetLocationOnEntryRestore",
    register(container) {
        container.registerDecorator(RestoreEntryFromBinWithFolderFallbackDecorator);
    }
});
