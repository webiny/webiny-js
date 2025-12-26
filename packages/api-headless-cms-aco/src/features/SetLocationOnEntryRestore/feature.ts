import { createFeature } from "@webiny/feature/api";
import { SetLocationOnEntryRestoreImpl } from "./SetLocationOnEntryRestore.js";

export const SetLocationOnEntryRestoreFeature = createFeature({
    name: "SetLocationOnEntryRestore",
    register(container) {
        container.register(SetLocationOnEntryRestoreImpl);
    }
});
