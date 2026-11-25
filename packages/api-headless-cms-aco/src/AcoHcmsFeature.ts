import { createFeature } from "@webiny/feature/api";
import { SetLocationOnEntryRestoreFeature } from "~/features/SetLocationOnEntryRestore/index.js";
import { ScheduleEntryFolderGuardFeature } from "~/features/ScheduleEntryFolderGuard/index.js";
import { CmsFolderPermissions } from "~/features/CmsFolderPermissions/CmsFolderPermissions.js";

export const AcoHcmsFeature = createFeature({
    name: "AcoHcms",
    register(container) {
        SetLocationOnEntryRestoreFeature.register(container);
        ScheduleEntryFolderGuardFeature.register(container);
        container.register(CmsFolderPermissions);
    }
});
