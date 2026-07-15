import { createFeature } from "@webiny/feature/api";
import { ExecuteSyncWithRetry } from "./ExecuteSyncWithRetry.js";

export const ExecuteSyncWithRetryFeature = createFeature({
    name: "sync.executeSyncWithRetry",
    register(container) {
        container.register(ExecuteSyncWithRetry);
    }
});
