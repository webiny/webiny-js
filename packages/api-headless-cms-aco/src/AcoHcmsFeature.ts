import { type Container, createFeature } from "@webiny/feature/api";
import { SetLocationOnEntryRestoreFeature } from "~/features/SetLocationOnEntryRestore/index.js";

export const AcoHcmsFeature = createFeature({
    name: "AcoHcms",
    register(container: Container) {
        SetLocationOnEntryRestoreFeature.register(container);
    }
});
