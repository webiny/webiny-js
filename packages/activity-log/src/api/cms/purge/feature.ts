import { type Container, createFeature } from "@webiny/feature/api";
import { PurgeActivityRecordsTaskDefinition } from "./PurgeActivityRecordsTaskDefinition.js";
import { PurgeOnEntryDeleted } from "./PurgeOnEntryDeleted.js";

export const PurgeFeature = createFeature({
    name: "ActivityLog/Purge",
    register(container: Container) {
        container.register(PurgeActivityRecordsTaskDefinition);
        container.register(PurgeOnEntryDeleted);
    }
});
