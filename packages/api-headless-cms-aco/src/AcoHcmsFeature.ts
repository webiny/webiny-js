import { createFeature } from "@webiny/feature/api";
import { SetLocationOnEntryRestoreFeature } from "~/features/SetLocationOnEntryRestore/index.js";

export const AcoHcmsFeature = createFeature({
    name: "AcoHcms",
    register(container) {
        SetLocationOnEntryRestoreFeature.register(container);
    }
});
