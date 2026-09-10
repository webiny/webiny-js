import { createFeature } from "@webiny/feature/api";
import { SimpleEntryDataFactoriesFeature } from "./entryDataFactories/SimpleEntryDataFactoriesFeature.js";
import { CreateSimpleEntryFeature } from "./createSimpleEntry/feature.js";

export const SimpleContentEntriesFeature = createFeature({
    name: "SimpleContentEntries",
    register(container) {
        SimpleEntryDataFactoriesFeature.register(container);

        // Command features.
        CreateSimpleEntryFeature.register(container);
    }
});
