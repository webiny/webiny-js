import { createFeature } from "@webiny/feature/api";
import { ExecuteSyncImplementation } from "./implementation.js";

export const ExecuteSyncFeature = createFeature({
    name: "sync.executeSync",
    register(container) {
        container.register(ExecuteSyncImplementation);
    }
});
