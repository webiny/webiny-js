import { createFeature } from "@webiny/feature/api";
import { ScheduleEntryFolderGuard } from "./ScheduleEntryFolderGuard.js";

export const ScheduleEntryFolderGuardFeature = createFeature({
    name: "ScheduleEntryFolderGuard",
    register(container) {
        container.register(ScheduleEntryFolderGuard);
    }
});
