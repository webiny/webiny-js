import { createFeature } from "@webiny/feature/api";
import { SynchronizationBuilderImplementation } from "./implementation.js";

export const SynchronizationBuilderFeature = createFeature({
    name: "sync.synchronizationBuilder",
    register(container) {
        container.register(SynchronizationBuilderImplementation);
    }
});
