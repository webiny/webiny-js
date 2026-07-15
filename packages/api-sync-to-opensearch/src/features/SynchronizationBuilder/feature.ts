import { createFeature } from "@webiny/feature/api";
import { SynchronizationBuilderImplementation } from "./SynchronizationBuilder.js";

export const SynchronizationBuilderFeature = createFeature({
    name: "sync.synchronizationBuilder",
    register(container) {
        container.register(SynchronizationBuilderImplementation);
    }
});
