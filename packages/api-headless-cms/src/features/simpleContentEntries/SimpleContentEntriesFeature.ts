import { createFeature } from "@webiny/feature/api";
import { SimpleEntryDataFactoriesFeature } from "./entryDataFactories/SimpleEntryDataFactoriesFeature.js";
import { GetSimpleEntryFeature } from "./getSimpleEntry/feature.js";
import { ListSimpleEntriesFeature } from "./listSimpleEntries/feature.js";
import { CreateSimpleEntryFeature } from "./createSimpleEntry/feature.js";
import { UpdateSimpleEntryFeature } from "./updateSimpleEntry/feature.js";
import { DeleteSimpleEntryFeature } from "./deleteSimpleEntry/feature.js";

export const SimpleContentEntriesFeature = createFeature({
    name: "SimpleContentEntries",
    register(container) {
        SimpleEntryDataFactoriesFeature.register(container);

        // Query features.
        GetSimpleEntryFeature.register(container);
        ListSimpleEntriesFeature.register(container);

        // Command features.
        CreateSimpleEntryFeature.register(container);
        UpdateSimpleEntryFeature.register(container);
        DeleteSimpleEntryFeature.register(container);
    }
});
