import { createFeature } from "@webiny/feature/api";
import type { Container } from "@webiny/di";
import { SetLocationOnEntryRestoreFeature } from "~/features/SetLocationOnEntryRestore/index.js";

export const AcoHcmsFeature = createFeature({
    name: "AcoHcms",
    register(container: Container) {
        SetLocationOnEntryRestoreFeature.register(container);
    }
});
