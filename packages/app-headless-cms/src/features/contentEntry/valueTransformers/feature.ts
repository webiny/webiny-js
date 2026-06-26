import { createFeature } from "@webiny/feature/admin";
import { EntryDataPreparer, EntryDataPreparerImpl } from "./EntryDataPreparer.js";
import { CmsEntryValueTransformer } from "./abstractions.js";
import { DynamicZoneValueTransformer } from "./DynamicZoneValueTransformer.js";
import { ObjectValueTransformer } from "./ObjectValueTransformer.js";

export const ValueTransformersFeature = createFeature({
    name: "CmsEntryValueTransformers",
    register(container) {
        container.register(DynamicZoneValueTransformer);
        container.register(ObjectValueTransformer);
        container.registerInstance(
            EntryDataPreparer,
            new EntryDataPreparerImpl(() => container.resolveAll(CmsEntryValueTransformer))
        );
    }
});
