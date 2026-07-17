import { createFeature } from "@webiny/feature/api";
import { ExecuteSync } from "./ExecuteSync.js";

export const ExecuteSyncFeature = createFeature({
    name: "sync.executeSync",
    register(container) {
        container.register(ExecuteSync);
    }
});
