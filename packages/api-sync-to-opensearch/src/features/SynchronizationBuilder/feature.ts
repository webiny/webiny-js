import { createFeature } from "@webiny/feature/api";
import { SynchronizationBuilder } from "./SynchronizationBuilder.js";

export const SynchronizationBuilderFeature = createFeature({
    name: "sync.synchronizationBuilder",
    register(container) {
        container.register(SynchronizationBuilder);
    }
});
