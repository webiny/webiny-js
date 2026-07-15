import { createFeature } from "@webiny/feature/api";
import { ExecuteSyncImplementation } from "./ExecuteSync.js";

export const ExecuteSyncFeature = createFeature({
    name: "sync.executeSync",
    register(container) {
        container.register(ExecuteSyncImplementation);
    }
});
