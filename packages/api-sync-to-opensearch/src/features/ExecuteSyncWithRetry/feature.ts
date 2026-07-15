import { createFeature } from "@webiny/feature/api";
import { ExecuteSyncWithRetryImplementation } from "./implementation.js";

export const ExecuteSyncWithRetryFeature = createFeature({
    name: "sync.executeSyncWithRetry",
    register(container) {
        container.register(ExecuteSyncWithRetryImplementation);
    }
});
