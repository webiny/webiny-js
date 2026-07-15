import { createFeature } from "@webiny/feature/api";
import { ExecuteSyncWithRetryImplementation } from "./ExecuteSyncWithRetry.js";

export const ExecuteSyncWithRetryFeature = createFeature({
    name: "sync.executeSyncWithRetry",
    register(container) {
        container.register(ExecuteSyncWithRetryImplementation);
    }
});
