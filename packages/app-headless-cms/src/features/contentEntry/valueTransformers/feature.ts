import { createFeature } from "@webiny/feature/admin";
import { EntryDataPreparerImplementation } from "./EntryDataPreparer.js";
import { DynamicZoneValueTransformer } from "./DynamicZoneValueTransformer.js";
import { ObjectValueTransformer } from "./ObjectValueTransformer.js";

export const ValueTransformersFeature = createFeature({
    name: "CmsEntryValueTransformers",
    register(container) {
        container.register(EntryDataPreparerImplementation);
        container.register(DynamicZoneValueTransformer);
        container.register(ObjectValueTransformer);
    }
});
